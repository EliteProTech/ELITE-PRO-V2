import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { unzipSync } from 'fflate'
import { fileURLToPath } from 'url'

const projectRoot = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'))

function shouldSkip(file) {
    const normalized = file.replace(/\\/g, '/')
    return normalized === 'config.js' ||
        normalized.startsWith('session/') ||
        normalized.startsWith('node_modules/') ||
        normalized.startsWith('.git/') ||
        normalized.startsWith('lib/database/') ||
        normalized.startsWith('tmp/')
}

function getRepo() {
    const repo = String(global.repo || '').trim().replace(/\/+$/, '').replace(/\.git$/i, '')
    const match = repo.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)$/i)
    if (!match) throw new Error('Invalid global.repo.')
    return { owner: match[1], name: match[2] }
}

function localFiles(directory = projectRoot, relative = '') {
    const files = new Map()
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const nextRelative = path.posix.join(relative, entry.name)
        if (shouldSkip(nextRelative)) continue
        const fullPath = path.join(directory, entry.name)
        if (entry.isDirectory()) {
            for (const [name, data] of localFiles(fullPath, nextRelative)) files.set(name, data)
        } else if (entry.isFile()) {
            files.set(nextRelative, fs.readFileSync(fullPath))
        }
    }
    return files
}

let handler = async (m) => {
    try {
        const repo = getRepo()
        const archiveUrl = `https://github.com/${repo.owner}/${repo.name}/archive/refs/heads/main.zip`
        const response = await axios.get(archiveUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            maxContentLength: 200 * 1024 * 1024
        })
        const archive = unzipSync(new Uint8Array(response.data))
        const names = Object.keys(archive)
        if (!names.length) throw new Error('GitHub returned an empty update archive.')

        const root = `${names[0].split('/')[0]}/`
        const remote = new Map()
        for (const name of names) {
            if (!name.startsWith(root) || name.endsWith('/')) continue
            const relative = name.slice(root.length)
            if (relative && !shouldSkip(relative)) remote.set(relative, Buffer.from(archive[name]))
        }

        const local = localFiles()
        const added = [...remote.keys()].filter(file => !local.has(file))
        const changed = [...remote.keys()].filter(file => local.has(file) && !remote.get(file).equals(local.get(file)))
        const localOnly = [...local.keys()].filter(file => !remote.has(file))
        const entries = [
            ...added.map(file => `+ ${file}`),
            ...changed.map(file => `~ ${file}`),
            ...localOnly.map(file => `- ${file}`)
        ]

        if (!entries.length) return await m.reply('*Update Check*\n\nYour tracked project files already match GitHub main.')

        const preview = entries.slice(0, 40).join('\n')
        const extra = entries.length > 40 ? `\n… and ${entries.length - 40} more file(s).` : ''
        await m.reply(
            `*Update Check*\n\n` +
            `Remote added: *${added.length}*\n` +
            `Remote changed: *${changed.length}*\n` +
            `Local-only: *${localOnly.length}*\n\n` +
            `${preview}${extra}\n\n` +
            `+ will be added, ~ will be overwritten by update, - is local-only and is not deleted by update.`
        )
    } catch (error) {
        await m.reply(`Update check failed: ${error.message || String(error)}`)
    }
}

handler.command = ['checkupdate']
handler.owner = true

export default handler
