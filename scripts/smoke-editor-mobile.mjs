import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { URL } from 'node:url';

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            const port = typeof address === 'object' && address ? address.port : 0;
            server.close(() => resolve(port));
        });
    });
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function findChrome() {
    const candidates = [
        process.env.CHROME_PATH,
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        process.env.LOCALAPPDATA
            ? path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe')
            : null,
        process.env.ProgramFiles
            ? path.join(process.env.ProgramFiles, 'Google/Chrome/Application/chrome.exe')
            : null,
        process.env['ProgramFiles(x86)']
            ? path.join(
                  process.env['ProgramFiles(x86)'],
                  'Google/Chrome/Application/chrome.exe'
              )
            : null,
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (await fileExists(candidate)) {
            return candidate;
        }
    }

    throw new Error(
        'Chrome was not found. Set CHROME_PATH to run the mobile editor smoke test.'
    );
}

class CdpSocket {
    constructor(webSocketUrl) {
        this.url = new URL(webSocketUrl);
        this.nextId = 1;
        this.pending = new Map();
        this.buffer = Buffer.alloc(0);
        this.socket = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            const key = randomBytes(16).toString('base64');
            const socket = net.createConnection(
                {
                    host: this.url.hostname,
                    port: Number(this.url.port),
                },
                () => {
                    socket.write(
                        [
                            `GET ${this.url.pathname}${this.url.search} HTTP/1.1`,
                            `Host: ${this.url.host}`,
                            'Upgrade: websocket',
                            'Connection: Upgrade',
                            `Sec-WebSocket-Key: ${key}`,
                            'Sec-WebSocket-Version: 13',
                            '',
                            '',
                        ].join('\r\n')
                    );
                }
            );

            let handshake = Buffer.alloc(0);
            let connected = false;

            socket.on('data', (chunk) => {
                if (!connected) {
                    handshake = Buffer.concat([handshake, chunk]);
                    const marker = handshake.indexOf('\r\n\r\n');

                    if (marker === -1) {
                        return;
                    }

                    const header = handshake.slice(0, marker).toString('utf8');
                    if (!header.includes(' 101 ')) {
                        reject(new Error(`Chrome websocket handshake failed: ${header}`));
                        socket.destroy();
                        return;
                    }

                    connected = true;
                    this.socket = socket;
                    const rest = handshake.slice(marker + 4);
                    if (rest.length > 0) {
                        this.consume(rest);
                    }
                    resolve();
                    return;
                }

                this.consume(chunk);
            });

            socket.on('error', reject);
            socket.on('close', () => {
                for (const { reject: rejectPending } of this.pending.values()) {
                    rejectPending(new Error('Chrome websocket closed.'));
                }
                this.pending.clear();
            });
        });
    }

    consume(chunk) {
        this.buffer = Buffer.concat([this.buffer, chunk]);

        while (this.buffer.length >= 2) {
            const first = this.buffer[0];
            const second = this.buffer[1];
            const opcode = first & 0x0f;
            const masked = (second & 0x80) !== 0;
            let length = second & 0x7f;
            let offset = 2;

            if (length === 126) {
                if (this.buffer.length < offset + 2) {
                    return;
                }
                length = this.buffer.readUInt16BE(offset);
                offset += 2;
            } else if (length === 127) {
                if (this.buffer.length < offset + 8) {
                    return;
                }
                length = Number(this.buffer.readBigUInt64BE(offset));
                offset += 8;
            }

            const maskOffset = offset;
            if (masked) {
                offset += 4;
            }

            if (this.buffer.length < offset + length) {
                return;
            }

            const frameBuffer = this.buffer;
            let payload = frameBuffer.slice(offset, offset + length);
            this.buffer = frameBuffer.slice(offset + length);

            if (masked) {
                const mask = frameBuffer.slice(maskOffset, maskOffset + 4);
                payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
            }

            if (opcode === 8) {
                this.close();
                return;
            }

            if (opcode !== 1) {
                continue;
            }

            const message = JSON.parse(payload.toString('utf8'));
            if (message.id && this.pending.has(message.id)) {
                const { resolve, reject } = this.pending.get(message.id);
                this.pending.delete(message.id);

                if (message.error) {
                    reject(new Error(message.error.message));
                } else {
                    resolve(message.result);
                }
            }
        }
    }

    send(method, params = {}) {
        const id = this.nextId;
        this.nextId += 1;
        const payload = JSON.stringify({ id, method, params });
        const payloadBuffer = Buffer.from(payload, 'utf8');
        let headerLength = 2;

        if (payloadBuffer.length >= 126 && payloadBuffer.length < 65536) {
            headerLength += 2;
        } else if (payloadBuffer.length >= 65536) {
            headerLength += 8;
        }

        const frame = Buffer.alloc(headerLength + 4 + payloadBuffer.length);
        frame[0] = 0x81;

        let offset = 2;
        if (payloadBuffer.length < 126) {
            frame[1] = 0x80 | payloadBuffer.length;
        } else if (payloadBuffer.length < 65536) {
            frame[1] = 0x80 | 126;
            frame.writeUInt16BE(payloadBuffer.length, offset);
            offset += 2;
        } else {
            frame[1] = 0x80 | 127;
            frame.writeBigUInt64BE(BigInt(payloadBuffer.length), offset);
            offset += 8;
        }

        const mask = randomBytes(4);
        mask.copy(frame, offset);
        offset += 4;

        for (let index = 0; index < payloadBuffer.length; index += 1) {
            frame[offset + index] = payloadBuffer[index] ^ mask[index % 4];
        }

        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.socket.write(frame, (error) => {
                if (error) {
                    this.pending.delete(id);
                    reject(error);
                }
            });
        });
    }

    async evaluate(expression) {
        const result = await this.send('Runtime.evaluate', {
            expression,
            awaitPromise: true,
            returnByValue: true,
            timeout: 10000,
        });

        if (result.exceptionDetails) {
            throw new Error(
                result.exceptionDetails.exception?.description ??
                result.exceptionDetails.text ??
                'JavaScript evaluation failed.'
            );
        }

        return result.result.value;
    }

    close() {
        this.socket?.destroy();
    }
}

async function waitForChrome(port) {
    for (let attempt = 0; attempt < 80; attempt += 1) {
        try {
            const response = await fetch(`http://127.0.0.1:${port}/json/version`);
            if (response.ok) {
                return response.json();
            }
        } catch {
            // keep waiting
        }
        await sleep(125);
    }

    throw new Error('Chrome remote debugging endpoint did not become ready.');
}

async function clickPoint(cdp, x, y) {
    await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y,
        button: 'none',
        pointerType: 'mouse',
    });
    await cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x,
        y,
        button: 'left',
        clickCount: 1,
        pointerType: 'mouse',
    });
    await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x,
        y,
        button: 'left',
        clickCount: 1,
        pointerType: 'mouse',
    });
}

async function dragPatternCells(cdp, cells, { keepPressed = false } = {}) {
    const points = await cdp.evaluate(`(${JSON.stringify(cells)}).map(([x, y]) =>
        window.__patternRegression.cellPoint(x, y))`);
    await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved', ...points[0], button: 'none', pointerType: 'mouse',
    });
    await cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed', ...points[0], button: 'left', buttons: 1,
        clickCount: 1, pointerType: 'mouse',
    });
    for (const point of points.slice(1)) {
        await cdp.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved', ...point, button: 'left', buttons: 1, pointerType: 'mouse',
        });
    }
    if (!keepPressed) {
        await cdp.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased', ...points.at(-1), button: 'left', buttons: 0,
            clickCount: 1, pointerType: 'mouse',
        });
    }
    return points.at(-1);
}

async function waitForState(cdp, expression, description) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
        if (await cdp.evaluate(expression)) {
            return;
        }
        await sleep(100);
    }
    throw new Error(`Timed out waiting for ${description}.`);
}

async function installPatternRegressionHelpers(cdp) {
    await cdp.evaluate(`
        window.__patternRegression = {
            visible(element) {
                return !!element && element.getClientRects().length > 0;
            },
            button(text) {
                return Array.from(document.querySelectorAll('button')).find((element) =>
                    this.visible(element) && element.textContent.trim() === text
                );
            },
            click(text) {
                const button = this.button(text);
                if (!button || button.disabled) throw new Error('Unavailable button: ' + text);
                button.click();
            },
            upload(input, file) {
                if (!input) throw new Error('Missing upload input');
                const transfer = new DataTransfer();
                transfer.items.add(file);
                input.files = transfer.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            },
            pixels() {
                // The hidden working canvas stores unscaled RGBA pixels, without preview grid lines.
                const canvas = document.querySelector('canvas.hidden');
                if (!canvas || canvas.width < 2 || canvas.height < 2) return '';
                const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
                let binary = '';
                for (let offset = 0; offset < data.length; offset += 0x8000) {
                    binary += String.fromCharCode(...data.subarray(offset, offset + 0x8000));
                }
                return btoa(binary);
            },
            preview() {
                const canvas = document.querySelector('canvas[aria-label="Bead pattern preview"]');
                if (canvas) return canvas.toDataURL();
                return Array.from(document.querySelectorAll('img[alt="Bead pattern preview"]'))
                    .find((element) => this.visible(element))?.src || '';
            },
            point(fraction) {
                const canvas = document.querySelector('canvas[aria-label="Bead pattern preview"]');
                if (!canvas) throw new Error('Missing editable preview canvas');
                const rect = canvas.getBoundingClientRect();
                return { x: rect.left + rect.width * fraction, y: rect.top + rect.height * fraction };
            },
            cellPoint(x, y) {
                const canvas = document.querySelector('canvas[aria-label="Bead pattern preview"]');
                const working = document.querySelector('canvas.hidden');
                if (!canvas || !working) throw new Error('Missing pattern canvas');
                const rect = canvas.getBoundingClientRect();
                const point = {
                    x: rect.left + rect.width * (x + 0.5) / working.width,
                    y: rect.top + rect.height * (y + 0.5) / working.height,
                };
                if (document.elementFromPoint(point.x, point.y) !== canvas) {
                    throw new Error('Pattern cell is outside the accessible canvas: ' + x + ',' + y);
                }
                return point;
            },
            tool(label) {
                const button = Array.from(document.querySelectorAll('button[aria-label]'))
                    .find((element) => this.visible(element) && element.getAttribute('aria-label') === label);
                if (!button) throw new Error('Missing editor tool: ' + label);
                button.click();
            },
            usage() {
                const canvas = document.querySelector('canvas.hidden');
                const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
                const colors = new Set();
                let beads = 0;
                for (let offset = 0; offset < data.length; offset += 4) {
                    if (data[offset + 3] === 0) continue;
                    beads += 1;
                    colors.add(Array.from(data.subarray(offset, offset + 3)).join(','));
                }
                const displayed = (label) => {
                    const term = Array.from(document.querySelectorAll('dt'))
                        .find((element) => this.visible(element) && element.textContent.trim() === label);
                    return term ? Number(term.nextElementSibling.textContent.replaceAll(',', '').trim()) : null;
                };
                return { beads, colors: colors.size, displayedBeads: displayed('Total Beads'), displayedColors: displayed('Colors') };
            },
            history() {
                return {
                    undo: this.button('Undo')?.disabled === false,
                    redo: this.button('Redo')?.disabled === false,
                };
            },
            async save() {
                let savedText = '';
                const original = URL.createObjectURL;
                URL.createObjectURL = (blob) => {
                    if (blob.type.includes('json')) blob.text().then((text) => { savedText = text; });
                    return original.call(URL, blob);
                };
                try {
                    this.click('Save');
                    for (let attempt = 0; attempt < 30 && !savedText; attempt += 1) {
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    }
                    if (!savedText) throw new Error('No project JSON was downloaded');
                    return savedText;
                } finally {
                    URL.createObjectURL = original;
                }
            },
        };
    `);
}

async function assertPatternState(cdp, expectedPixels, description, expectedHistory) {
    // Allow debounced regeneration to run; checking immediately could miss the original regression.
    await sleep(500);
    const state = await cdp.evaluate(`({
        pixels: window.__patternRegression.pixels(),
        history: window.__patternRegression.history(),
    })`);
    if (state.pixels !== expectedPixels) {
        throw new Error(`${description} changed the working pattern pixels.`);
    }
    if (expectedHistory &&
        (state.history.undo !== expectedHistory.undo || state.history.redo !== expectedHistory.redo)) {
        throw new Error(`${description} changed Undo/Redo availability: ${JSON.stringify(state.history)}.`);
    }
}

async function runPatternPreservationRegression(cdp) {
    await cdp.evaluate('document.querySelector(\'button[aria-label="Close export dialog"]\')?.click()');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: false,
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await installPatternRegressionHelpers(cdp);
    await cdp.evaluate(`
        (async () => {
            const canvas = document.createElement('canvas');
            canvas.width = 8;
            canvas.height = 8;
            const context = canvas.getContext('2d');
            context.fillStyle = '#f05020';
            context.fillRect(0, 0, 8, 8);
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
            window.__patternRegression.upload(
                document.querySelector('input[name="editorMobileImage"]'),
                new File([blob], 'settings-regression.png', { type: 'image/png' })
            );
        })()
    `);
    await waitForState(cdp,
        `document.querySelector('img[alt="Source image"]') &&
            window.__patternRegression.pixels() && window.__patternRegression.button('Undo')?.disabled`,
        'uploaded image pattern');
    await sleep(500);
    const originalPixels = await cdp.evaluate('window.__patternRegression.pixels()');
    await cdp.evaluate(`Array.from(document.querySelectorAll('button[aria-label="Erase"]'))
        .find((element) => window.__patternRegression.visible(element)).click()`);
    const firstPoint = await cdp.evaluate('window.__patternRegression.point(0.3)');
    await clickPoint(cdp, firstPoint.x, firstPoint.y);
    await sleep(200);
    const editedPixels = await cdp.evaluate('window.__patternRegression.pixels()');
    if (editedPixels === originalPixels) throw new Error('Erasing the uploaded image did not change a bead.');

    const secondPoint = await cdp.evaluate('window.__patternRegression.point(0.7)');
    await clickPoint(cdp, secondPoint.x, secondPoint.y);
    await sleep(200);
    const twoEditPixels = await cdp.evaluate('window.__patternRegression.pixels()');
    if (twoEditPixels === editedPixels) throw new Error('Second bead edit did not change the pattern.');
    await cdp.evaluate("window.__patternRegression.click('Undo')");
    const bothHistory = { undo: true, redo: true };
    await assertPatternState(cdp, editedPixels, 'Undo before changing settings', bothHistory);

    await cdp.evaluate("window.__patternRegression.click('Export')");
    await waitForState(cdp, '!!document.querySelector(\'input[name="exportFileName"]\')', 'export dialog');
    await cdp.evaluate(`
        const input = document.querySelector('input[name="exportFileName"]');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'preserved-pattern');
        input.dispatchEvent(new Event('input', { bubbles: true }));
    `);
    await assertPatternState(cdp, editedPixels, 'Changing the export filename', bothHistory);
    const symbolsEnabled = await cdp.evaluate(`
        const symbols = document.querySelector('input[name="exportSymbols"]');
        symbols.click();
        symbols.checked;
    `);
    await assertPatternState(cdp, editedPixels, 'Changing export symbols', bothHistory);
    await cdp.evaluate('document.querySelector(\'button[aria-label="Close export dialog"]\').click()');
    await cdp.evaluate("window.__patternRegression.click('Redo')");
    await assertPatternState(cdp, twoEditPixels, 'Redo after changing export settings', { undo: true, redo: false });
    await cdp.evaluate("window.__patternRegression.click('Undo')");
    await assertPatternState(cdp, editedPixels, 'Undo after changing export settings', bothHistory);

    const savedProjectText = await cdp.evaluate('window.__patternRegression.save()');
    const savedProject = JSON.parse(savedProjectText);
    if (savedProject.draft.editedPattern?.data !== editedPixels ||
        savedProject.draft.fileName !== 'preserved-pattern' ||
        savedProject.draft.useSymbols !== symbolsEnabled) {
        throw new Error('Saved project did not retain edited pixels and export settings.');
    }
    // Change a bead again so the restore must actually replace the current pattern.
    await clickPoint(cdp, secondPoint.x, secondPoint.y);
    await assertPatternState(cdp, twoEditPixels, 'Editing before project restore');
    const restoreProject = `window.__patternRegression.upload(
        document.querySelector('input[name="projectUpload"]'),
        new File([${JSON.stringify(savedProjectText)}], 'settings-regression.bead-pattern.json', { type: 'application/json' })
    )`;
    await cdp.evaluate(restoreProject);
    await waitForState(cdp, `window.__patternRegression.pixels() === ${JSON.stringify(editedPixels)}`, 'restored edited image');
    await assertPatternState(cdp, editedPixels, 'Saving and reopening the edited image');

    const editorErrors = await cdp.evaluate('window.__qaErrors || []');
    if (editorErrors.length) throw new Error(`Editor regression browser errors: ${editorErrors.join('; ')}`);
    // Grid is exposed in the home Advanced dialog. Reopen the same project there.
    await cdp.send('Page.navigate', { url: new URL('/', baseUrl).toString() });
    await waitForState(cdp, `document.readyState === 'complete' && !!document.querySelector('input[name="projectUpload"]')`, 'home project controls');
    await installPatternRegressionHelpers(cdp);
    await cdp.evaluate(restoreProject);
    await waitForState(cdp, `window.__patternRegression.pixels() === ${JSON.stringify(editedPixels)}`, 'home restored edited image');
    await cdp.evaluate("window.__patternRegression.click('Advanced')");
    await waitForState(cdp, '!!document.querySelector(\'input[name="editorRenderGrid"]\')', 'preview grid control');
    const previewBeforeGrid = await cdp.evaluate('window.__patternRegression.preview()');
    await cdp.evaluate('document.querySelector(\'input[name="editorRenderGrid"]\').click()');
    await assertPatternState(cdp, editedPixels, 'Toggling the preview grid');
    const previewAfterGrid = await cdp.evaluate('window.__patternRegression.preview()');
    if (!previewBeforeGrid || previewBeforeGrid === previewAfterGrid) {
        throw new Error('Toggling the grid did not update the preview.');
    }
    const homeErrors = await cdp.evaluate('window.__qaErrors || []');
    if (homeErrors.length) throw new Error(`Grid regression browser errors: ${homeErrors.join('; ')}`);
    const largeProject = await runLargeProjectRegression(cdp, savedProjectText);
    const strokeHistory = await runStrokeHistoryRegression(cdp, savedProjectText);
    const asyncExport = await runAsyncExportRegression(cdp);
    return {
        editedImagePreserved: true,
        exportSettingsPreserveUndoRedo: true,
        projectRoundTripPreservedPixels: true,
        gridChangesPreviewOnly: true,
        largeProject,
        strokeHistory,
        asyncExport,
    };
}

async function assertPatternUsage(cdp, expectedBeads, expectedColors, description) {
    await waitForState(cdp, `(() => {
        const usage = window.__patternRegression.usage();
        return usage.beads === ${expectedBeads} && usage.colors === ${expectedColors} &&
            usage.displayedBeads === usage.beads && usage.displayedColors === usage.colors;
    })()`, `${description}: ${expectedBeads} beads and ${expectedColors} colors`);
}

async function selectRegressionColor(cdp, ref) {
    await cdp.evaluate(`Array.from(document.querySelectorAll('button[title="Select bead color"]'))
        .find((element) => window.__patternRegression.visible(element)).click()`);
    await waitForState(cdp, '!!document.querySelector(\'[role="dialog"][aria-label="Select Color"]\')', 'color picker');
    await waitForState(cdp, `Array.from(document.querySelectorAll('[role="dialog"][aria-label="Select Color"] button span'))
        .some((span) => span.textContent.trim() === ${JSON.stringify(ref)})`, `loaded color ${ref}`);
    await cdp.evaluate(`(() => {
        const dialog = document.querySelector('[role="dialog"][aria-label="Select Color"]');
        const button = Array.from(dialog.querySelectorAll('button')).find((element) =>
            Array.from(element.querySelectorAll('span')).some((span) => span.textContent.trim() === ${JSON.stringify(ref)}));
        if (!button) throw new Error('Missing regression color: ' + ${JSON.stringify(ref)} + '; available: ' +
            Array.from(dialog.querySelectorAll('button')).slice(0, 20).map((element) => element.textContent.trim()).join(' | '));
        button.click();
    })()`);
    await waitForState(cdp, '!document.querySelector(\'[role="dialog"][aria-label="Select Color"]\')', 'selected bead color');
}

async function runStrokeHistoryRegression(cdp, projectTemplateText) {
    await cdp.evaluate(`(() => {
        const project = JSON.parse(${JSON.stringify(projectTemplateText)});
        const dimension = 29;
        const data = btoa(String.fromCharCode(...new Uint8Array(dimension * dimension * 4)));
        const entries = project.draft.activePalettes.flatMap((palette) => palette.entries).filter((entry) => entry.enabled);
        const first = entries[0];
        const second = entries.find((entry) => ['r', 'g', 'b'].some((channel) => entry.color[channel] !== first.color[channel]));
        if (!first || !second) throw new Error('Regression needs two distinct enabled colors');
        Object.assign(project.draft, {
            sourceMode: 'blank', imageSrc: null, fileName: 'stroke-history-regression',
            boardId: 'midi', boardWidth: 1, boardHeight: 1,
            editedPattern: { width: dimension, height: dimension, byteLength: dimension * dimension * 4, data },
        });
        window.__strokeRegression = { projectText: JSON.stringify(project), blankPixels: data, firstRef: first.ref, secondRef: second.ref };
    })()`);
    const resetPattern = async () => {
        await cdp.evaluate(`window.__patternRegression.upload(
            document.querySelector('input[name="projectUpload"]'),
            new File([window.__strokeRegression.projectText], 'stroke-history.bead-pattern.json', { type: 'application/json' })
        )`);
        await waitForState(cdp, `window.__patternRegression.pixels() === window.__strokeRegression.blankPixels &&
            !window.__patternRegression.history().undo && !window.__patternRegression.history().redo`, 'blank stroke test project');
        await assertPatternUsage(cdp, 0, 0, 'Blank project statistics');
        const firstRef = await cdp.evaluate('window.__strokeRegression.firstRef');
        await selectRegressionColor(cdp, firstRef);
        await cdp.evaluate("window.__patternRegression.tool('Bead')");
    };
    await resetPattern();
    const blank = await cdp.evaluate('window.__strokeRegression.blankPixels');
    const firstStroke = [[8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8]];
    await dragPatternCells(cdp, firstStroke);
    await assertPatternUsage(cdp, 6, 1, 'Six-cell paint stroke');
    const painted = await cdp.evaluate('window.__patternRegression.pixels()');
    await cdp.evaluate("window.__patternRegression.click('Undo')");
    await assertPatternState(cdp, blank, 'Undo of an entire paint stroke', { undo: false, redo: true });
    await assertPatternUsage(cdp, 0, 0, 'Undone paint stroke statistics');
    await cdp.evaluate("window.__patternRegression.click('Redo')");
    await assertPatternState(cdp, painted, 'Redo of an entire paint stroke', { undo: true, redo: false });

    await dragPatternCells(cdp, firstStroke);
    await cdp.evaluate("window.__patternRegression.click('Undo')");
    await assertPatternState(cdp, blank, 'Painting the same color creates no extra history', { undo: false, redo: true });
    await cdp.evaluate("window.__patternRegression.click('Redo')");
    await cdp.evaluate("window.__patternRegression.tool('Erase')");
    await dragPatternCells(cdp, [[9, 8], [10, 8], [11, 8]]);
    await assertPatternUsage(cdp, 3, 1, 'Three-cell erase stroke');
    const erased = await cdp.evaluate('window.__patternRegression.pixels()');
    await cdp.evaluate("window.__patternRegression.click('Undo')");
    await assertPatternState(cdp, painted, 'Undo of an entire erase stroke', { undo: true, redo: true });
    await cdp.evaluate("window.__patternRegression.click('Redo')");
    await assertPatternState(cdp, erased, 'Redo of an entire erase stroke', { undo: true, redo: false });
    await assertPatternUsage(cdp, 3, 1, 'Redone erase stroke statistics');
    await cdp.evaluate("window.__patternRegression.click('Undo')");
    await cdp.evaluate("window.__patternRegression.tool('Bead')");
    await dragPatternCells(cdp, firstStroke);
    await assertPatternState(cdp, painted, 'Same-color stroke preserves existing redo', { undo: true, redo: true });

    const secondRef = await cdp.evaluate('window.__strokeRegression.secondRef');
    await selectRegressionColor(cdp, secondRef);
    await dragPatternCells(cdp, [[8, 8], [9, 8], [10, 8]]);
    await assertPatternUsage(cdp, 6, 2, 'Recolor stroke statistics');
    const recolored = await cdp.evaluate('window.__patternRegression.pixels()');
    await assertPatternState(cdp, recolored, 'A changed stroke clears the redo branch', { undo: true, redo: false });
    await cdp.evaluate("window.__patternRegression.click('Undo')");
    await assertPatternState(cdp, painted, 'Undo of a recolor stroke');
    await assertPatternUsage(cdp, 6, 1, 'Undone recolor statistics');
    await cdp.evaluate("window.__patternRegression.click('Redo')");
    await assertPatternState(cdp, recolored, 'Redo of a recolor stroke');
    await assertPatternUsage(cdp, 6, 2, 'Redone recolor statistics');

    for (const termination of ['pointercancel', 'lostpointercapture']) {
        await resetPattern();
        await cdp.evaluate(`document.querySelector('canvas[aria-label="Bead pattern preview"]').addEventListener(
            'pointerdown', (event) => { window.__strokeRegression.pointerId = event.pointerId; }, { once: true }
        )`);
        await dragPatternCells(cdp, [[8, 8], [9, 8]], { keepPressed: true });
        await cdp.evaluate(`(() => {
            const canvas = document.querySelector('canvas[aria-label="Bead pattern preview"]');
            const pointerId = window.__strokeRegression.pointerId;
            if (${JSON.stringify(termination)} === 'pointercancel') {
                canvas.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId, pointerType: 'mouse', buttons: 0 }));
            } else {
                if (!canvas.hasPointerCapture(pointerId)) throw new Error('Drawing did not capture the pointer');
                canvas.releasePointerCapture(pointerId);
            }
        })()`);
        const afterTermination = await cdp.evaluate('window.__patternRegression.pixels()');
        const hover = await cdp.evaluate('window.__patternRegression.cellPoint(13, 8)');
        await cdp.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved', ...hover, button: 'left', buttons: 1, pointerType: 'mouse',
        });
        await cdp.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased', ...hover, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse',
        });
        await assertPatternState(cdp, afterTermination, `${termination} stops the active stroke`, { undo: true, redo: false });
        await assertPatternUsage(cdp, 2, 1, `${termination} keeps only the completed cells`);
        await dragPatternCells(cdp, [[8, 10], [9, 10], [10, 10]]);
        await assertPatternUsage(cdp, 5, 1, `New stroke after ${termination}`);
        const nextStroke = await cdp.evaluate('window.__patternRegression.pixels()');
        await cdp.evaluate("window.__patternRegression.click('Undo')");
        await assertPatternState(cdp, afterTermination, `Next stroke stays separate after ${termination}`, { undo: true, redo: true });
        await cdp.evaluate("window.__patternRegression.click('Undo')");
        await assertPatternState(cdp, blank, `${termination} stroke is a single undo entry`, { undo: false, redo: true });
        await cdp.evaluate("window.__patternRegression.click('Redo')");
        await assertPatternState(cdp, afterTermination, `Redo of ${termination} stroke`);
        await cdp.evaluate("window.__patternRegression.click('Redo')");
        await assertPatternState(cdp, nextStroke, `Redo of the stroke after ${termination}`);
        await assertPatternUsage(cdp, 5, 1, `${termination} redo statistics`);
    }
    const errors = await cdp.evaluate('window.__qaErrors || []');
    if (errors.length) throw new Error(`Stroke history browser errors: ${errors.join('; ')}`);
    return {
        paintAndEraseUndoByStroke: true,
        sameColorPreservesHistory: true,
        changedStrokeClearsRedo: true,
        statisticsMatchPattern: true,
        pointerCancelAndLostCaptureEndStroke: true,
    };
}

async function runAsyncExportRegression(cdp) {
    await cdp.evaluate("window.__patternRegression.click('Export')");
    await waitForState(cdp, '!!document.querySelector(\'[role="dialog"][aria-label="Export"]\')', 'async export dialog');
    await cdp.evaluate(`(() => {
        const state = window.__exportRegression = { calls: 0, downloads: 0, pending: null };
        state.originalToBlob = HTMLCanvasElement.prototype.toBlob;
        state.originalClick = HTMLAnchorElement.prototype.click;
        HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
            if (type !== 'image/png') return state.originalToBlob.call(this, callback, type, quality);
            state.calls += 1;
            state.pending = (fail) => {
                state.pending = null;
                if (fail) callback(null);
                else state.originalToBlob.call(this, callback, type, quality);
            };
        };
        HTMLAnchorElement.prototype.click = function() {
            if (this.download.endsWith('.png')) state.downloads += 1;
            return state.originalClick.call(this);
        };
    })()`);
    const startExport = async () => {
        await cdp.evaluate("window.__patternRegression.click('Printable PNG')");
        await waitForState(cdp, 'typeof window.__exportRegression.pending === "function"', 'PNG encoding callback');
        // Keep encoding suspended beyond a React render so premature finally blocks are observable.
        await sleep(250);
        const state = await cdp.evaluate(`(() => {
            const dialog = document.querySelector('[role="dialog"][aria-label="Export"]');
            const exportButtons = Array.from(dialog.querySelectorAll('button')).filter((button) =>
                button.getAttribute('aria-label') !== 'Close export dialog');
            return {
                busy: dialog.getAttribute('aria-busy') === 'true',
                allDisabled: exportButtons.length > 0 && exportButtons.every((button) => button.disabled),
                hasProgress: !!dialog.querySelector('[role="status"]'),
            };
        })()`);
        if (!state.busy || !state.allDisabled || !state.hasProgress) {
            throw new Error(`PNG export stopped waiting before encoding finished: ${JSON.stringify(state)}.`);
        }
    };
    try {
        await startExport();
        await cdp.evaluate('window.__exportRegression.pending(false)');
        await waitForState(cdp, `document.querySelector('[role="dialog"][aria-label="Export"]').getAttribute('aria-busy') === 'false' &&
            window.__exportRegression.downloads === 1 && !window.__patternRegression.button('Printable PNG').disabled`, 'successful PNG export completion');
        await startExport();
        await cdp.evaluate('window.__exportRegression.pending(true)');
        await waitForState(cdp, `(() => {
            const dialog = document.querySelector('[role="dialog"][aria-label="Export"]');
            const alert = dialog.querySelector('[role="alert"]');
            return dialog.getAttribute('aria-busy') === 'false' && window.__patternRegression.visible(alert) &&
                alert.textContent.includes('The image could not be encoded') &&
                !window.__patternRegression.button('Printable PNG').disabled;
        })()`, 'visible PNG encoding failure and enabled retry');
        const failedDownloads = await cdp.evaluate('window.__exportRegression.downloads');
        if (failedDownloads !== 1) throw new Error('Failed PNG encoding unexpectedly downloaded a file.');
        await startExport();
        await cdp.evaluate('window.__exportRegression.pending(false)');
        await waitForState(cdp, `document.querySelector('[role="dialog"][aria-label="Export"]').getAttribute('aria-busy') === 'false' &&
            window.__exportRegression.downloads === 2 && !document.body.innerText.includes('The image could not be encoded')`, 'successful retry after PNG failure');
        const errors = await cdp.evaluate('window.__qaErrors || []');
        if (errors.length) throw new Error(`Async export browser errors: ${errors.join('; ')}`);
        return { loadingWaitsForEncoding: true, encodingFailureShown: true, failedExportCanRetry: true };
    } finally {
        await cdp.evaluate(`(() => {
            const state = window.__exportRegression;
            HTMLCanvasElement.prototype.toBlob = state.originalToBlob;
            HTMLAnchorElement.prototype.click = state.originalClick;
            state.pending?.(true);
            document.querySelector('button[aria-label="Close export dialog"]')?.click();
        })()`);
    }
}

async function runLargeProjectRegression(cdp, projectTemplateText) {
    await cdp.send('Page.navigate', { url: new URL('/editor', baseUrl).toString() });
    await waitForState(cdp,
        `document.readyState === 'complete' && !!document.querySelector('input[name="projectUpload"]')`,
        'editor for large project');
    await installPatternRegressionHelpers(cdp);
    await cdp.evaluate(`
        (() => {
            const project = JSON.parse(${JSON.stringify(projectTemplateText)});
            const dimension = 57 * 11;
            const pixels = new Uint8ClampedArray(dimension * dimension * 4);
            const entry = project.draft.activePalettes.flatMap((palette) => palette.entries)
                .find((entry) => entry.enabled);
            for (const position of [0, dimension - 1, Math.floor(dimension / 2) * dimension + Math.floor(dimension / 2), dimension * dimension - 1]) {
                pixels.set([entry.color.r, entry.color.g, entry.color.b, 255], position * 4);
            }
            let binary = '';
            for (let offset = 0; offset < pixels.length; offset += 0x8000) {
                binary += String.fromCharCode(...pixels.subarray(offset, offset + 0x8000));
            }
            project.draft.sourceMode = 'blank';
            project.draft.imageSrc = null;
            project.draft.fileName = 'large-pattern-regression';
            project.draft.boardId = 'mini';
            project.draft.boardWidth = 11;
            project.draft.boardHeight = 11;
            project.draft.editedPattern = {
                width: dimension, height: dimension, byteLength: pixels.length, data: btoa(binary),
            };
            window.__largeRegression = { initialPixels: project.draft.editedPattern.data };
            window.__patternRegression.upload(
                document.querySelector('input[name="projectUpload"]'),
                new File([JSON.stringify(project)], 'large-pattern.bead-pattern.json', { type: 'application/json' })
            );
        })()
    `);
    await waitForState(cdp,
        'window.__patternRegression.pixels() === window.__largeRegression.initialPixels',
        'large project import');
    await sleep(700);
    const importedCorrectly = await cdp.evaluate('window.__patternRegression.pixels() === window.__largeRegression.initialPixels');
    if (!importedCorrectly) throw new Error('Large imported pattern changed after initialization.');
    await cdp.evaluate(`Array.from(document.querySelectorAll('button[aria-label="Erase"]'))
        .find((element) => window.__patternRegression.visible(element)).click()`);
    const center = await cdp.evaluate('window.__patternRegression.point(0.5)');
    await clickPoint(cdp, center.x, center.y);
    await waitForState(cdp, 'window.__patternRegression.history().undo', 'manual large pattern edit');
    const saveResult = await cdp.evaluate(`
        (async () => {
            const state = window.__largeRegression;
            state.editedPixels = window.__patternRegression.pixels();
            state.savedText = await window.__patternRegression.save();
            const draft = JSON.parse(state.savedText).draft;
            return {
                changed: state.initialPixels !== state.editedPixels,
                complete: draft.editedPattern?.data === state.editedPixels,
                pixelBytes: draft.editedPattern?.byteLength,
                savedProjectBytes: new Blob([state.savedText]).size,
            };
        })()
    `);
    if (!saveResult.changed || !saveResult.complete || saveResult.pixelBytes <= 1_500_000) {
        throw new Error(`Large project save lost pattern data: ${JSON.stringify(saveResult)}.`);
    }
    await cdp.evaluate("window.__patternRegression.click('Undo')");
    await waitForState(cdp,
        'window.__patternRegression.pixels() === window.__largeRegression.initialPixels',
        'large pattern undo before restore');
    await cdp.evaluate(`window.__patternRegression.upload(
        document.querySelector('input[name="projectUpload"]'),
        new File([window.__largeRegression.savedText], 'large-pattern.bead-pattern.json', { type: 'application/json' })
    )`);
    await waitForState(cdp,
        'window.__patternRegression.pixels() === window.__largeRegression.editedPixels',
        'large edited project restoration');
    await sleep(700);
    const result = await cdp.evaluate(`({
        restoredSamePixels: window.__patternRegression.pixels() === window.__largeRegression.editedPixels,
        errors: window.__qaErrors || [],
    })`);
    if (!result.restoredSamePixels || result.errors.length) {
        throw new Error(`Large project round trip failed: ${JSON.stringify(result)}.`);
    }
    return {
        pixelBytes: saveResult.pixelBytes,
        savedProjectBytes: saveResult.savedProjectBytes,
        restoredSamePixels: true,
    };
}

async function openWorkerRegressionPage(cdp, mode) {
    const script = await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `
            (() => {
                // This smoke test owns its disposable Chrome profile.
                sessionStorage.clear();
                const NativeWorker = window.Worker;
                const probe = window.__workerRegression = {
                    mode: ${JSON.stringify(mode)},
                    attempts: 0, posted: 0, received: 0, results: 0, held: 0, released: 0,
                    workers: [], pending: [], holdNextResponse: false,
                    release() {
                        for (const deliver of this.pending.splice(0)) deliver();
                    },
                };
                if (probe.mode === 'unavailable') {
                    window.Worker = undefined;
                    return;
                }
                window.Worker = class extends NativeWorker {
                    constructor(...args) {
                        probe.attempts += 1;
                        if (probe.mode === 'constructor-failure') {
                            throw new Error('Intentional smoke-test Worker startup failure');
                        }
                        super(...args);
                        this.record = { url: String(args[0]), posted: 0, received: 0, terminated: false };
                        probe.workers.push(this.record);
                        this.addEventListener('message', (event) => {
                            if (this.releasing || event.data?.type === 'ready') return;
                            probe.received += 1;
                            this.record.received += 1;
                            if (event.data?.type === 'result' && event.data.pixels instanceof Uint8ClampedArray &&
                                event.data.pixels.byteLength === 87 * 87 * 4) {
                                probe.results += 1;
                            }
                            if (!probe.holdNextResponse) return;
                            probe.holdNextResponse = false;
                            probe.held += 1;
                            event.stopImmediatePropagation();
                            // Keep the actual native Worker result; only its delivery is delayed.
                            // This deliberately tests cancellation and UI interactivity, not speed.
                            probe.pending.push(() => {
                                this.releasing = true;
                                try {
                                    this.dispatchEvent(new MessageEvent('message', { data: event.data }));
                                    probe.released += 1;
                                } finally {
                                    this.releasing = false;
                                }
                            });
                        });
                    }
                    postMessage(...args) {
                        probe.posted += 1;
                        this.record.posted += 1;
                        return super.postMessage(...args);
                    }
                    terminate() {
                        this.record.terminated = true;
                        return super.terminate();
                    }
                };
            })();
        `,
    });
    try {
        await cdp.send('Page.navigate', { url: new URL('/', baseUrl).toString() });
        await waitForState(cdp,
            `document.readyState === 'complete' && !!document.querySelector('input[name="homeSourceImage"]')`,
            `${mode} Worker regression page`);
    } finally {
        await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: script.identifier });
    }
    await installPatternRegressionHelpers(cdp);
    // Wait for a React-handled interaction before changing controlled inputs.
    await cdp.evaluate("window.__patternRegression.click('Advanced')");
    await waitForState(cdp, `!!document.querySelector('[role="dialog"][aria-label="Advanced"]')`, 'hydrated Worker regression controls');
    await cdp.evaluate('document.querySelector(\'button[aria-label="Close Advanced"]\').click()');
    await cdp.evaluate(`
        window.__workerRegression.setInput = (name, value) => {
            const input = document.querySelector('input[name="' + name + '"]');
            if (!input) throw new Error('Missing Worker regression input: ' + name);
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(value));
            input.dispatchEvent(new Event('input', { bubbles: true }));
        };
        window.__workerRegression.upload = async (color) => {
            const canvas = document.createElement('canvas');
            canvas.width = 8;
            canvas.height = 8;
            const context = canvas.getContext('2d');
            context.fillStyle = color;
            context.fillRect(0, 0, 8, 8);
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
            window.__patternRegression.upload(
                document.querySelector('input[name="homeSourceImage"]'),
                new File([blob], 'worker-' + color.slice(1) + '.png', { type: 'image/png' })
            );
        };
        // 87 x 87 beads exercises the Worker path, above the small-pattern threshold.
        window.__workerRegression.setInput('homeBoardWidth', 3);
        window.__workerRegression.setInput('homeBoardHeight', 3);
    `);
    await waitForState(cdp,
        `document.querySelector('input[name="homeBoardWidth"]').value === '3' &&
            document.querySelector('input[name="homeBoardHeight"]').value === '3'`,
        'Worker regression board dimensions');
}

async function waitForWorkerPattern(cdp, description, expectedPixels, previousReplies = 0) {
    await waitForState(cdp, `(() => {
        const working = document.querySelector('canvas.hidden');
        return working?.width === 87 && working.height === 87 &&
            window.__patternRegression.button('Export')?.disabled === false &&
            ${expectedPixels
                ? `window.__patternRegression.pixels() === ${JSON.stringify(expectedPixels)}`
                : `!!window.__patternRegression.pixels()`} &&
            (window.__workerRegression.mode !== 'native' || window.__workerRegression.received > ${previousReplies});
    })()`, description);
}

async function runWorkerRegression(cdp) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await openWorkerRegressionPage(cdp, 'native');
    await cdp.evaluate("window.__workerRegression.upload('#ff0000')");
    await waitForWorkerPattern(cdp, 'real native Worker pattern');
    const redPixels = await cdp.evaluate('window.__patternRegression.pixels()');
    await cdp.evaluate(`
        window.__patternRegression.click('Advanced');
    `);
    await waitForState(cdp, `!!document.querySelector('input[name="editor-image-brightness-number"]')`, 'brightness control');
    let previousReplies = await cdp.evaluate('window.__workerRegression.received');
    await cdp.evaluate("window.__workerRegression.setInput('editor-image-brightness-number', 0)");
    await waitForWorkerPattern(cdp, 'brightness baseline Worker pattern', null, previousReplies);
    const darkPixels = await cdp.evaluate('window.__patternRegression.pixels()');
    if (redPixels === darkPixels) throw new Error('Worker brightness fixture did not change the pattern.');
    previousReplies = await cdp.evaluate('window.__workerRegression.received');
    await cdp.evaluate("window.__workerRegression.setInput('editor-image-brightness-number', 100)");
    await waitForWorkerPattern(cdp, 'restored brightness Worker pattern', redPixels, previousReplies);
    await cdp.evaluate('document.querySelector(\'button[aria-label="Close Advanced"]\').click()');

    await cdp.evaluate(`
        window.__workerRegression.holdNextResponse = true;
        window.__workerRegression.upload('#0000ff');
    `);
    await waitForState(cdp, 'window.__workerRegression.held === 1', 'held image Worker reply');
    const pendingUi = await cdp.evaluate(`({
        exportDisabled: window.__patternRegression.button('Export')?.disabled,
        pixelsPreserved: window.__patternRegression.pixels() === ${JSON.stringify(redPixels)},
    })`);
    if (!pendingUi.exportDisabled || !pendingUi.pixelsPreserved) {
        throw new Error('Pending Worker generation did not preserve the committed pattern and disable export.');
    }
    // Opening a real application dialog must still render while the reply remains held.
    await cdp.evaluate("window.__patternRegression.click('Advanced')");
    await waitForState(cdp, `!!document.querySelector('[role="dialog"][aria-label="Advanced"]')`, 'UI response during pending Worker');
    const stillPending = await cdp.evaluate(`window.__workerRegression.pending.length === 1 &&
        window.__patternRegression.button('Export')?.disabled === true`);
    if (!stillPending) throw new Error('Worker reply was not pending during the UI responsiveness check.');
    await cdp.evaluate('document.querySelector(\'button[aria-label="Close Advanced"]\').click()');
    previousReplies = await cdp.evaluate('window.__workerRegression.received');
    await cdp.evaluate("window.__workerRegression.upload('#ff0000')");
    await waitForWorkerPattern(cdp, 'new image superseding the pending Worker', redPixels, previousReplies);
    await cdp.evaluate('window.__workerRegression.release()');
    await assertPatternState(cdp, redPixels, 'Late Worker result after replacing the image');

    await cdp.evaluate("window.__patternRegression.click('Advanced')");
    await waitForState(cdp, `!!document.querySelector('input[name="editor-image-brightness-number"]')`, 'brightness race control');
    await waitForState(cdp, `(() => {
        const draft = JSON.parse(sessionStorage.getItem('bead-pattern-editor-draft-v1'));
        return draft?.imageAdjustments.brightness === 100 && draft.editedPattern?.data === ${JSON.stringify(redPixels)};
    })()`, 'last completed draft before the parameter race');
    const completedDraft = await cdp.evaluate("sessionStorage.getItem('bead-pattern-editor-draft-v1')");
    await cdp.evaluate(`
        window.__workerRegression.holdNextResponse = true;
        window.__workerRegression.setInput('editor-image-brightness-number', 40);
    `);
    await waitForState(cdp, 'window.__workerRegression.held === 2', 'held parameter Worker reply');
    await sleep(500);
    const pendingDraft = await cdp.evaluate("sessionStorage.getItem('bead-pattern-editor-draft-v1')");
    if (pendingDraft !== completedDraft) {
        throw new Error('Pending Worker settings changed the last completed automatic draft.');
    }
    const editorEntries = await cdp.evaluate(`(() => {
        const buttons = Array.from(document.querySelectorAll('button')).filter((button) =>
            button.getAttribute('aria-label') === 'Open editor' || button.textContent.trim() === 'Edit Pattern');
        return { count: buttons.length, allDisabled: buttons.every((button) => button.disabled) };
    })()`);
    if (editorEntries.count !== 2 || !editorEntries.allDisabled) {
        throw new Error('Both home editor entry buttons must be disabled while generation is pending.');
    }
    previousReplies = await cdp.evaluate('window.__workerRegression.received');
    await cdp.evaluate("window.__workerRegression.setInput('editor-image-brightness-number', 0)");
    await waitForWorkerPattern(cdp, 'new parameters superseding the pending Worker', darkPixels, previousReplies);
    await cdp.evaluate('window.__workerRegression.release()');
    await assertPatternState(cdp, darkPixels, 'Late Worker result after changing parameters');
    await waitForState(cdp, `(() => {
        const draft = JSON.parse(sessionStorage.getItem('bead-pattern-editor-draft-v1'));
        return draft?.imageAdjustments.brightness === 0 && draft.editedPattern?.data === ${JSON.stringify(darkPixels)};
    })()`, 'new settings and pixels saved together after Worker completion');
    await cdp.evaluate('document.querySelector(\'button[aria-label="Close Advanced"]\').click()');

    const repeatedSource = await cdp.evaluate("JSON.parse(sessionStorage.getItem('bead-pattern-editor-draft-v1')).imageSrc");
    previousReplies = await cdp.evaluate('window.__workerRegression.received');
    await cdp.evaluate("window.__workerRegression.upload('#ff0000')");
    await waitForWorkerPattern(cdp, 'same image uploaded again after completion', darkPixels, previousReplies);
    await cdp.evaluate(`
        window.__workerRegression.holdNextResponse = true;
        window.__workerRegression.upload('#ff0000');
    `);
    await waitForState(cdp, 'window.__workerRegression.held === 3', 'held same-image Worker reply');
    previousReplies = await cdp.evaluate('window.__workerRegression.received');
    await cdp.evaluate("window.__workerRegression.upload('#ff0000')");
    await waitForWorkerPattern(cdp, 'same image replacing its pending conversion', darkPixels, previousReplies);
    await cdp.evaluate('window.__workerRegression.release()');
    await assertPatternState(cdp, darkPixels, 'Late Worker result after uploading the same image again');
    const repeatedSourceMatches = await cdp.evaluate(`
        JSON.parse(sessionStorage.getItem('bead-pattern-editor-draft-v1')).imageSrc === ${JSON.stringify(repeatedSource)}`);
    if (!repeatedSourceMatches) throw new Error('Repeated-image fixture did not use identical source data.');
    const native = await cdp.evaluate(`({
        created: window.__workerRegression.workers.length,
        replies: window.__workerRegression.received,
        results: window.__workerRegression.results,
        released: window.__workerRegression.released,
        allTerminated: window.__workerRegression.workers.every((worker) => worker.terminated),
        assetUrls: [...new Set(window.__workerRegression.workers.map((worker) => worker.url))],
        errors: window.__qaErrors || [],
    })`);
    if (!native.created || native.replies < 10 || native.results !== native.replies || native.released !== 3 ||
        !native.allTerminated || native.errors.length) {
        throw new Error(`Native Worker regression failed: ${JSON.stringify(native)}.`);
    }

    const fallback = {};
    for (const mode of ['unavailable', 'constructor-failure']) {
        await openWorkerRegressionPage(cdp, mode);
        await cdp.evaluate("window.__workerRegression.upload('#ff0000')");
        await waitForWorkerPattern(cdp, `${mode} fallback pattern`, redPixels);
        const status = await cdp.evaluate(`({
            attempts: window.__workerRegression.attempts,
            created: window.__workerRegression.workers.length,
            errors: window.__qaErrors || [],
        })`);
        if (status.created || status.errors.length ||
            (mode === 'constructor-failure' && status.attempts < 1)) {
            throw new Error(`Worker fallback regression failed: ${JSON.stringify({ mode, ...status })}.`);
        }
        fallback[mode] = { samePixelsAsNativeWorker: true, attempts: status.attempts };
    }
    return {
        nativeWorker: native,
        fallback,
        staleImageResultIgnored: true,
        staleParameterResultIgnored: true,
        committedPixelsPreservedWhilePending: true,
        uiRespondedWhileWorkerReplyHeld: true,
        lastCompletedDraftPreservedWhilePending: true,
        completedDraftHasMatchingSettingsAndPixels: true,
        editorEntryDisabledWhilePending: true,
        identicalImageCanBeUploadedAfterCompletion: true,
        identicalImageCanReplacePendingConversion: true,
        delayPurpose: 'Controlled response delivery for cancellation and UI checks; not a performance benchmark.',
    };
}

async function main() {
    const chromePath = await findChrome();
    const port = await getFreePort();
    const userDataDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'bead-pattern-maker-mobile-smoke-')
    );
    const chrome = spawn(
        chromePath,
        [
            '--headless=new',
            `--remote-debugging-port=${port}`,
            '--remote-allow-origins=*',
            `--user-data-dir=${userDataDir}`,
            '--disable-gpu',
            '--no-first-run',
            '--no-default-browser-check',
            '--window-size=390,844',
            'about:blank',
        ],
        { stdio: 'ignore' }
    );

    let cdp;

    try {
        await waitForChrome(port);
        const targetResponse = await fetch(
            `http://127.0.0.1:${port}/json/new?about:blank`,
            { method: 'PUT' }
        );
        const target = await targetResponse.json();
        cdp = new CdpSocket(target.webSocketDebuggerUrl);
        await cdp.connect();

        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
            source: `
                window.__qaErrors = [];
                window.addEventListener('error', (event) => {
                    window.__qaErrors.push(String(event.message || event.error || 'error'));
                });
                window.addEventListener('unhandledrejection', (event) => {
                    window.__qaErrors.push(String(event.reason?.message || event.reason || 'rejection'));
                });
            `,
        });
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 390,
            height: 844,
            deviceScaleFactor: 2,
            mobile: true,
            screenWidth: 390,
            screenHeight: 844,
        });
        await cdp.send('Emulation.setTouchEmulationEnabled', {
            enabled: true,
            maxTouchPoints: 5,
        });

        const homeUrl = new URL('/', baseUrl).toString();
        await cdp.send('Page.navigate', { url: homeUrl });

        for (let attempt = 0; attempt < 80; attempt += 1) {
            const ready = await cdp.evaluate(
                "document.readyState === 'complete' && document.body.innerText.includes('Pattern Preview')"
            );
            if (ready) {
                break;
            }
            await sleep(125);
        }

        const homeFlow = await cdp.evaluate(`
            (async () => {
                const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                const visible = (element) => {
                    if (!element) return false;
                    const rect = element.getBoundingClientRect();
                    const style = getComputedStyle(element);
                    return style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        rect.width > 1 &&
                        rect.height > 1 &&
                        rect.bottom > 0 &&
                        rect.right > 0 &&
                        rect.left < innerWidth &&
                        rect.top < innerHeight;
                };
                const byText = (selector, text, exact = false) =>
                    Array.from(document.querySelectorAll(selector)).find((element) => {
                        if (!visible(element)) return false;
                        const content = (element.textContent || '').trim().toLowerCase();
                        return exact
                            ? content === text.toLowerCase()
                            : content.includes(text.toLowerCase());
                    });
                const makeImageFile = (name, colors) =>
                    new Promise((resolve, reject) => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 4;
                        canvas.height = 4;
                        const context = canvas.getContext('2d');
                        if (!context) {
                            reject(new Error('canvas'));
                            return;
                        }
                        colors.forEach((color, index) => {
                            context.fillStyle = color;
                            context.fillRect(
                                (index % 2) * 2,
                                Math.floor(index / 2) * 2,
                                2,
                                2
                            );
                        });
                        canvas.toBlob((blob) => {
                            if (!blob) {
                                reject(new Error('blob'));
                                return;
                            }
                            resolve(new File([blob], name, { type: 'image/png' }));
                        }, 'image/png');
                    });
                const uploadFile = (input, file) => {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    input.files = dataTransfer.files;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                };
                const visiblePreviewSrc = () => {
                    const image = Array.from(
                        document.querySelectorAll('img[alt="Bead pattern preview"]')
                    ).find(visible);
                    return image?.getAttribute('src') || '';
                };
                const debugState = () => ({
                    previewSrc: visiblePreviewSrc().slice(0, 80),
                    buttons: Array.from(document.querySelectorAll('button'))
                        .filter(visible)
                        .map((button) => ({
                            text: (button.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 50),
                            ariaLabel: button.getAttribute('aria-label') || '',
                            disabled: button.disabled,
                        })),
                    images: Array.from(document.querySelectorAll('img'))
                        .filter(visible)
                        .map((image) => ({
                            alt: image.getAttribute('alt') || '',
                            src: (image.getAttribute('src') || '').slice(0, 80),
                        })),
                    bodyText: (document.body.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 240),
                });
                const waitForPreview = async (previousSrc = '') => {
                    for (let attempt = 0; attempt < 80; attempt += 1) {
                        const src = visiblePreviewSrc();
                        if (src && src !== previousSrc) {
                            return src;
                        }
                        await sleep(250);
                    }
                    return '';
                };
                const dispatchPinch = (target) => {
                    const rect = target.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const touch = (identifier, x, y) =>
                        new Touch({
                            identifier,
                            target,
                            clientX: x,
                            clientY: y,
                            screenX: x,
                            screenY: y,
                            pageX: x,
                            pageY: y,
                        });
                    const dispatch = (type, points) => {
                        target.dispatchEvent(
                            new TouchEvent(type, {
                                touches: type === 'touchend' ? [] : points,
                                targetTouches: type === 'touchend' ? [] : points,
                                changedTouches: points,
                                bubbles: true,
                                cancelable: true,
                            })
                        );
                    };
                    dispatch('touchstart', [
                        touch(1, centerX - 28, centerY),
                        touch(2, centerX + 28, centerY),
                    ]);
                    dispatch('touchmove', [
                        touch(1, centerX - 64, centerY),
                        touch(2, centerX + 64, centerY),
                    ]);
                    dispatch('touchend', []);
                };
                const input = document.querySelector('input[name="homeMobileSourceImage"]');
                if (!input) return { ok: false, step: 'home upload input' };

                uploadFile(
                    input,
                    await makeImageFile('mobile-smoke-a.png', [
                        '#ff0000',
                        '#0000ff',
                        '#ffffff',
                        '#000000',
                    ])
                );

                let zoomIn = null;
                let resetZoom = null;
                let editorButton = null;

                for (let attempt = 0; attempt < 60; attempt += 1) {
                    zoomIn = Array.from(
                        document.querySelectorAll('button[aria-label="Zoom in preview"]')
                    ).find(visible);
                    resetZoom = Array.from(
                        document.querySelectorAll('button[aria-label="Reset preview zoom"]')
                    ).find(visible);
                    editorButton = Array.from(
                        document.querySelectorAll('button[aria-label="Open editor"]')
                    ).find(visible);

                    if (zoomIn && resetZoom && editorButton && !editorButton.disabled) {
                        break;
                    }
                    await sleep(250);
                }

                if (!zoomIn) return { ok: false, step: 'home zoom in control', debug: debugState() };
                if (!resetZoom) return { ok: false, step: 'home zoom reset control', debug: debugState() };
                if (!editorButton) return { ok: false, step: 'home editor button', debug: debugState() };
                if (editorButton.disabled) {
                    return { ok: false, step: 'home editor button enabled', debug: debugState() };
                }

                const visibleEditorButtons = Array.from(
                    document.querySelectorAll('button[aria-label="Open editor"]')
                ).filter(visible);
                if (visibleEditorButtons.length !== 1) {
                    return {
                        ok: false,
                        step: 'home editor button count',
                        count: visibleEditorButtons.length,
                    };
                }

                const firstPreviewSrc = await waitForPreview();
                if (!firstPreviewSrc) {
                    return { ok: false, step: 'home first preview generated' };
                }

                const beforeZoom = (resetZoom.textContent || '').trim();
                zoomIn.click();
                await sleep(250);
                const afterZoom = (resetZoom.textContent || '').trim();
                if (beforeZoom === afterZoom) {
                    return { ok: false, step: 'home zoom changed', beforeZoom, afterZoom };
                }

                const previewSurface =
                    Array.from(document.querySelectorAll('img[alt="Bead pattern preview"]'))
                        .find(visible)
                        ?.closest('.bg-brutal-bg') ||
                    document.querySelector('img[alt="Bead pattern preview"]')
                        ?.parentElement;
                if (!previewSurface) {
                    return { ok: false, step: 'home pinch surface' };
                }
                dispatchPinch(previewSurface);
                await sleep(250);
                const afterPinchZoom = (resetZoom.textContent || '').trim();
                if (afterPinchZoom === afterZoom) {
                    return {
                        ok: false,
                        step: 'home pinch zoom changed',
                        afterZoom,
                        afterPinchZoom,
                    };
                }

                const change = byText('button', 'Change', true);
                if (!change) return { ok: false, step: 'home change button' };
                change.click();
                await sleep(250);
                const changeInput = document.querySelector('input[name="homeMobileSheetImage"]');
                if (!changeInput) return { ok: false, step: 'home change input' };
                uploadFile(
                    changeInput,
                    await makeImageFile('mobile-smoke-b.png', [
                        '#00ff00',
                        '#ffff00',
                        '#00ffff',
                        '#ff00ff',
                    ])
                );
                const secondPreviewSrc = await waitForPreview(firstPreviewSrc);
                if (!secondPreviewSrc) {
                    return { ok: false, step: 'home changed preview generated' };
                }

                editorButton.click();
                for (let attempt = 0; attempt < 30; attempt += 1) {
                    if (location.pathname === '/editor') {
                        break;
                    }
                    await sleep(100);
                }

                return {
                    ok: location.pathname === '/editor',
                    step: location.pathname === '/editor' ? 'done' : 'home editor navigation',
                    beforeZoom,
                    afterZoom,
                    afterPinchZoom,
                    previewChanged: firstPreviewSrc !== secondPreviewSrc,
                    horizontalOverflow: Math.max(
                        document.documentElement.scrollWidth,
                        document.body.scrollWidth
                    ) - innerWidth,
                };
            })()
        `);

        if (!homeFlow.ok) {
            throw new Error(
                `Home mobile setup failed at ${homeFlow.step}: ${JSON.stringify(
                    homeFlow.debug ?? {},
                    null,
                    2
                )}`
            );
        }
        if (homeFlow.horizontalOverflow > 1) {
            throw new Error(
                `Mobile home has ${homeFlow.horizontalOverflow}px horizontal overflow.`
            );
        }

        const editorUrl = new URL('/editor', baseUrl).toString();
        await cdp.send('Page.navigate', { url: editorUrl });

        for (let attempt = 0; attempt < 80; attempt += 1) {
            const ready = await cdp.evaluate(
                "document.readyState === 'complete' && document.body.innerText.includes('File')"
            );
            if (ready) {
                break;
            }
            await sleep(125);
        }

        const flow = await cdp.evaluate(`
            (async () => {
                const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                const visible = (element) => {
                    if (!element) return false;
                    const rect = element.getBoundingClientRect();
                    const style = getComputedStyle(element);
                    return style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        rect.width > 1 &&
                        rect.height > 1 &&
                        rect.bottom > 0 &&
                        rect.right > 0 &&
                        rect.left < innerWidth &&
                        rect.top < innerHeight;
                };
                const byText = (selector, text, exact = false) =>
                    Array.from(document.querySelectorAll(selector)).find((element) => {
                        if (!visible(element)) return false;
                        const content = (element.textContent || '').trim().toLowerCase();
                        return exact ? content === text.toLowerCase() : content.includes(text.toLowerCase());
                    });

                let blank = byText('button,label,a', 'Blank Pattern');
                if (!blank) {
                    const file = byText('button', 'File', true);
                    if (!file) return { ok: false, step: 'file' };
                    file.click();
                    await sleep(250);
                    blank = byText('button,label,a', 'Blank Pattern');
                }
                if (!blank) return { ok: false, step: 'blank' };
                blank.click();
                await sleep(700);

                const color = Array.from(
                    document.querySelectorAll('button[title="Select bead color"]')
                ).find(visible);
                if (!color) return { ok: false, step: 'color' };
                color.click();
                await sleep(300);
                const colorDialogOpen = !!document.querySelector('[role="dialog"][aria-label="Select Color"]');
                document.querySelector('button[aria-label="Close color picker"]')?.click();
                await sleep(250);

                const canvas = Array.from(document.querySelectorAll('canvas'))
                    .filter(visible)
                    .map((element) => {
                        const rect = element.getBoundingClientRect();
                        return {
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2,
                            width: rect.width,
                            height: rect.height,
                        };
                    })
                    .sort((a, b) => b.width * b.height - a.width * a.height)[0];

                return { ok: true, colorDialogOpen, canvas };
            })()
        `);

        if (!flow.ok) {
            throw new Error(`Editor setup failed at ${flow.step}.`);
        }
        if (!flow.colorDialogOpen) {
            throw new Error('Color dialog did not open.');
        }
        if (!flow.canvas) {
            throw new Error('Editable canvas was not visible.');
        }

        await clickPoint(cdp, flow.canvas.x, flow.canvas.y);
        await sleep(350);

        const projectRoundTrip = await cdp.evaluate(`
            (async () => {
                const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                const visible = (element) => {
                    if (!element) return false;
                    const rect = element.getBoundingClientRect();
                    const style = getComputedStyle(element);
                    return style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        rect.width > 1 &&
                        rect.height > 1 &&
                        rect.bottom > 0 &&
                        rect.right > 0 &&
                        rect.left < innerWidth &&
                        rect.top < innerHeight;
                };
                const byText = (selector, text, exact = false) =>
                    Array.from(document.querySelectorAll(selector)).find((element) => {
                        if (!visible(element)) return false;
                        const content = (element.textContent || '').trim().toLowerCase();
                        return exact ? content === text.toLowerCase() : content.includes(text.toLowerCase());
                    });
                const getWorkingCanvasDataUrl = () => {
                    const canvas = Array.from(document.querySelectorAll('canvas'))
                        .filter((element) => element.width > 1 && element.height > 1)
                        .sort((a, b) => b.width * b.height - a.width * a.height)[0];

                    return canvas ? canvas.toDataURL() : '';
                };

                let savedProjectText = '';
                const originalCreateObjectUrl = URL.createObjectURL.bind(URL);

                URL.createObjectURL = (blob) => {
                    if (blob instanceof Blob && blob.type.includes('json')) {
                        blob.text().then((text) => {
                            savedProjectText = text;
                        });
                    }

                    return originalCreateObjectUrl(blob);
                };

                try {
                    const beforeRestore = getWorkingCanvasDataUrl();
                    const file = byText('button', 'File', true);
                    if (!file) return { ok: false, step: 'project file panel' };
                    file.click();
                    await sleep(250);

                    const saveProject =
                        byText('button', 'Save Project', true) ||
                        byText('button', 'Save', true);
                    if (!saveProject) return { ok: false, step: 'project save button' };
                    if (saveProject.disabled) {
                        return { ok: false, step: 'project save enabled' };
                    }

                    saveProject.click();
                    for (let attempt = 0; attempt < 20; attempt += 1) {
                        if (savedProjectText) {
                            break;
                        }
                        await sleep(100);
                    }

                    if (!savedProjectText) {
                        return { ok: false, step: 'project saved text' };
                    }

                    const input = document.querySelector('input[name="projectUpload"]');
                    if (!input) return { ok: false, step: 'project upload input' };

                    const projectFile = new File(
                        [savedProjectText],
                        'mobile-smoke.bead-pattern.json',
                        { type: 'application/json' }
                    );
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(projectFile);
                    input.files = dataTransfer.files;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    await sleep(900);

                    const afterRestore = getWorkingCanvasDataUrl();
                    const bodyText = document.body.innerText || '';

                    return {
                        ok: Boolean(afterRestore) &&
                            beforeRestore === afterRestore &&
                            !bodyText.includes('Could not open project file') &&
                            !bodyText.includes('Could not read project file'),
                        step:
                            beforeRestore === afterRestore
                                ? 'done'
                                : 'project restored canvas',
                        savedProjectBytes: savedProjectText.length,
                        restoredSameCanvas: beforeRestore === afterRestore,
                    };
                } finally {
                    URL.createObjectURL = originalCreateObjectUrl;
                }
            })()
        `);

        if (!projectRoundTrip.ok) {
            throw new Error(
                `Project save/open round trip failed at ${projectRoundTrip.step}.`
            );
        }

        const exportButton = await cdp.evaluate(`
            (() => {
                const visible = (element) => {
                    const rect = element.getBoundingClientRect();
                    const style = getComputedStyle(element);
                    return style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        rect.width > 1 &&
                        rect.height > 1 &&
                        rect.bottom > 0 &&
                        rect.right > 0 &&
                        rect.left < innerWidth &&
                        rect.top < innerHeight;
                };
                const button = Array.from(document.querySelectorAll('button')).find((element) =>
                    visible(element) &&
                    ((element.getAttribute('title') || '').includes('Export') ||
                        (element.textContent || '').trim() === 'Export')
                );
                if (!button) return { found: false };
                const rect = button.getBoundingClientRect();
                return {
                    found: true,
                    disabled: button.disabled,
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                };
            })()
        `);

        if (!exportButton.found) {
            throw new Error('Export button was not found after drawing.');
        }
        if (exportButton.disabled) {
            throw new Error('Export button stayed disabled after drawing.');
        }

        await clickPoint(cdp, exportButton.x, exportButton.y);
        await sleep(300);

        const result = await cdp.evaluate(`
            (() => ({
                exportDialogOpen: !!document.querySelector('[role="dialog"][aria-label="Export"]'),
                horizontalOverflow: Math.max(
                    document.documentElement.scrollWidth,
                    document.body.scrollWidth
                ) - innerWidth,
                errors: window.__qaErrors || [],
            }))()
        `);

        if (!result.exportDialogOpen) {
            throw new Error('Export dialog did not open.');
        }
        if (result.horizontalOverflow > 1) {
            throw new Error(`Mobile editor has ${result.horizontalOverflow}px horizontal overflow.`);
        }
        if (result.errors.length > 0) {
            throw new Error(`Browser errors: ${result.errors.join('; ')}`);
        }

        const patternPreservation = await runPatternPreservationRegression(cdp);
        const workerRegression = await runWorkerRegression(cdp);

        console.log(
            JSON.stringify(
                {
                    editorMobileSmoke: 'passed',
                    homeMobileZoom: `${homeFlow.beforeZoom} -> ${homeFlow.afterZoom}`,
                    homeMobilePinchZoom: `${homeFlow.afterZoom} -> ${homeFlow.afterPinchZoom}`,
                    homeMobileChangeRegenerated: homeFlow.previewChanged,
                    homeMobileEditorEntry: 'passed',
                    baseUrl,
                    viewport: '390x844',
                    projectRoundTrip: {
                        savedProjectBytes: projectRoundTrip.savedProjectBytes,
                        restoredSameCanvas: projectRoundTrip.restoredSameCanvas,
                    },
                    exportDialogOpened: true,
                    horizontalOverflow: result.horizontalOverflow,
                    errors: result.errors,
                    patternPreservation,
                    workerRegression,
                },
                null,
                2
            )
        );
    } finally {
        cdp?.close();
        await new Promise((resolve) => {
            const timeout = setTimeout(resolve, 1000);
            chrome.once('exit', () => {
                clearTimeout(timeout);
                resolve();
            });
            chrome.kill('SIGKILL');
        });
        await fs.rm(userDataDir, { recursive: true, force: true }).catch(() => {});
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
