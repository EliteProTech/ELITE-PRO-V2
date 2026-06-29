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

const required = [
    'lib',
    'plugins',
    'handler.js',
    'main.js'
];

let worker = null;
let running = false;
let restartTimer = null;

async function downloadFolder(folderPath, localBase) {
    const url = `https://api.github.com/repos/${user}/${repo}/contents/${folderPath}?ref=${branch}`;

    const { data } = await axios.get(url, {
        headers: {
            'User-Agent': 'axios'
        }
    });

    for (const item of data) {
        const localPath = join(localBase, item.path.replace(githubFolder ? githubFolder + '/' : '', ''));

        if (item.type === 'dir') {
            mkdirSync(localPath, { recursive: true });
            await downloadFolder(item.path, localBase);
        } else {
            if (existsSync(localPath)) continue;

            mkdirSync(dirname(localPath), { recursive: true });

            const file = await axios.get(item.download_url, {
                responseType: 'text'
            });

            writeFileSync(localPath, file.data, 'utf8');
            console.log(`📥 ${item.path}`);
        }
    }
}

async function ensureFiles() {
    const missing = required.some(file => !existsSync(join(__dirname, file)));

    if (!missing) {
        console.log('✅ All required files exist.');
        return;
    }

    console.log('📦 Downloading missing files...');
    await downloadFolder(githubFolder, __dirname);
    console.log('✅ Download complete.');
}
