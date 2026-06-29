import { Worker } from 'worker_threads';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { watchFile, unwatchFile, existsSync, mkdirSync, writeFileSync } from 'fs';
import readline from 'readline';
import axios from 'axios';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rl = readline.createInterface(process.stdin, process.stdout);

const user = 'EliteProTech';
const repo = 'eliteprov2db';
const branch = 'main';
const githubFolder = '';

const requiredFiles = ['lib', 'plugins', 'handler.js', 'main.js'];

let worker = null;
let running = false;
let restartTimer = null;

async function downloadFolder(folderPath, localBase) {
    const url = `https://api.github.com/repos/${user}/${repo}/contents/${folderPath}?ref=${branch}`;

    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'axios' }
        });

        for (const item of data) {
            const localPath = join(localBase, item.path.replace(githubFolder ? githubFolder + '/' : '', ''));

            if (item.type === 'dir') {
                if (!existsSync(localPath)) {
                    mkdirSync(localPath, { recursive: true });
                }
                await downloadFolder(item.path, localBase);
            } else {
                if (existsSync(localPath)) continue;

                mkdirSync(dirname(localPath), { recursive: true });

                const { data: fileData } = await axios.get(item.download_url, {
                    responseType: 'text'
                });

                writeFileSync(localPath, fileData, 'utf8');
                console.log(`📥 Downloaded: ${item.path}`);
            }
        }
    } catch (err) {
        console.error(`❌ Failed downloading ${folderPath}:`, err.message);
    }
}

async function ensureFiles() {
    const missing = requiredFiles.some(file => !existsSync(join(__dirname, file)));

    if (!missing) {
        console.log('✅ Required files already exist.');
        return;
    }

    console.log('📦 Missing files detected.');
    console.log('⬇️ Downloading files from GitHub...');
    await downloadFolder(githubFolder, __dirname);
    console.log('✅ Download complete.');
}

function start(file) {
    if (running) return;

    running = true;
    const full = join(__dirname, file);

    if (worker) worker.terminate();

    worker = new Worker(full);

    if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
    }

    worker.on('message', msg => {
        console.log('[MESSAGE]', msg);
        if (msg === 'restart' || msg === 'reset') {
            restart();
        }
    });

    worker.on('exit', code => {
        console.log('❗ Worker exited with code', code);
        running = false;

        if (code !== 0) {
            restartTimer = setTimeout(() => {
                console.log('⏳ Auto restarting...');
                restart();
            }, 30 * 60 * 1000);
        }

        watchFile(full, () => {
            unwatchFile(full);
            console.log('♻️ File updated. Restarting...');
            start(file);
        });
    });

    if (!rl.listenerCount('line')) {
        rl.on('line', line => {
            const cmd = line.trim().toLowerCase();

            if (!cmd) return;

            if (cmd === 'exit') {
                console.log('⛔ Exiting...');
                worker?.terminate();
                process.exit(0);
            }

            if (cmd === 'restart' || cmd === 'reset') {
                console.log('🍃 Restarting...');
                restart();
                return;
            }

            worker?.postMessage(cmd);
        });
    }
}

function restart() {
    try {
        worker?.terminate();
    } catch (e) { }

    running = false;
    start('main.js');
}

(async () => {
    await ensureFiles();
    start('main.js');
})();
