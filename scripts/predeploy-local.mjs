import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

const startupTimeoutMs = 30000;
const requestTimeoutMs = 3000;

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

async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, requestTimeoutMs);

    try {
        return await fetch(url, {
            headers: {
                'user-agent': 'bead-pattern-maker-predeploy/1.0',
            },
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }
}

async function waitForServer(baseUrl, getOutputTail) {
    const startedAt = Date.now();
    let lastError;

    while (Date.now() - startedAt < startupTimeoutMs) {
        try {
            const response = await fetchWithTimeout(baseUrl);
            if (response.ok) {
                return;
            }

            lastError = new Error(`HTTP ${response.status}`);
        } catch (error) {
            lastError = error;
        }

        await sleep(500);
    }

    const message = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(
        `Next server did not become ready within ${startupTimeoutMs}ms: ${message}\n${getOutputTail()}`
    );
}

function runCommand(command, args, env) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            env,
            shell: false,
            stdio: 'inherit',
        });

        child.on('error', reject);
        child.on('exit', (code, signal) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(
                new Error(
                    `${command} ${args.join(' ')} exited with ${
                        signal ?? `code ${code}`
                    }`
                )
            );
        });
    });
}

function runNpmScript(script, env) {
    if (process.env.npm_execpath) {
        return runCommand(process.execPath, [process.env.npm_execpath, 'run', script], env);
    }

    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    return runCommand(npmCommand, ['run', script], env);
}

async function stopProcess(child) {
    if (child.exitCode !== null || child.signalCode !== null) {
        return;
    }

    await new Promise((resolve) => {
        const timeout = setTimeout(() => {
            child.kill('SIGKILL');
            resolve();
        }, 3000);

        child.once('exit', () => {
            clearTimeout(timeout);
            resolve();
        });

        child.kill('SIGTERM');
    });
}

const port = await getFreePort();
const baseUrl = `http://127.0.0.1:${port}`;
const nextCli = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const serverOutput = [];

const server = spawn(
    process.execPath,
    [nextCli, 'start', '--port', String(port), '--hostname', '127.0.0.1'],
    {
        env: process.env,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
    }
);

function appendOutput(chunk) {
    serverOutput.push(chunk.toString());
    while (serverOutput.length > 40) {
        serverOutput.shift();
    }
}

function getOutputTail() {
    return serverOutput.join('').trim();
}

server.stdout.on('data', appendOutput);
server.stderr.on('data', appendOutput);

try {
    await waitForServer(baseUrl, getOutputTail);

    const smokeEnv = {
        ...process.env,
        SMOKE_BASE_URL: baseUrl,
    };

    console.log(`Predeploy smoke target: ${baseUrl}`);
    await runNpmScript('smoke:prod', smokeEnv);
    await runNpmScript('smoke:editor-mobile', smokeEnv);

    console.log('Local predeploy checks passed.');
} finally {
    await stopProcess(server);
}
