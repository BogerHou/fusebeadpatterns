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
            throw new Error(result.exceptionDetails.text ?? 'JavaScript evaluation failed.');
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

        console.log(
            JSON.stringify(
                {
                    editorMobileSmoke: 'passed',
                    baseUrl,
                    viewport: '390x844',
                    exportDialogOpened: true,
                    horizontalOverflow: result.horizontalOverflow,
                    errors: result.errors,
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
