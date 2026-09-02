import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import axios from 'axios'
import { unzipSync } from 'fflate'
import { fileURLToPath } from 'url'

const execFileAsync = promisify(execFile)
const projectRoot = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'))
const branch = 'main'

const shouldSkip = file => {
    const normalized = file.replace(/\\/g, '/')
    return normalized === 'config.js' ||
        normalized.startsWith('session/') ||
        normalized.startsWith('node_modules/') ||
        normalized.startsWith('.git/') ||
        normalized.startsWith('lib/database/')
}

const getRepo = () => {
    const repo = String(global.repo || '').trim().replace(/\/+$/, '').replace(/\.git$/i, '')
    const match = repo.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)$/i)

    if (!match) {
        throw new Error('Invalid global.repo. Use https://github.com/EliteProTech/ELITE-PRO-V2')
    }

    return {
        owner: match[1],
        name: match[2],
        url: repo
    }
}

const isGitRepo = () => {
    try {
        return fs.existsSync(path.join(projectRoot, '.git'))
    } catch {
        return false
    }
}

const updateWithGit = async repo => {
    const { stdout: status } = await execFileAsync(
        'git',
        ['-C', projectRoot, 'status', '--porcelain'],
        { maxBuffer: 1024 * 1024 }
    )

    if (status.trim()) {
        throw new Error('Local changes detected. Commit or stash them before updating.')
    }

    const { stdout, stderr } = await execFileAsync(
        'git',
        ['-C', projectRoot, 'pull', '--ff-only', repo.url, branch],
        { maxBuffer: 10 * 1024 * 1024 }
    )

    return (stdout || stderr || 'Already up to date.').trim()
}

const updateWithZip = async repo => {
    const url = `https://github.com/${repo.owner}/${repo.name}/archive/refs/heads/${branch}.zip`

    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: 200 * 1024 * 1024
    })

    const files = unzipSync(new Uint8Array(response.data))
    const names = Object.keys(files)

    if (!names.length) {
        throw new Error('GitHub returned an empty update archive.')
    }

    const root = names[0].split('/')[0] + '/'
    let updated = 0

    for (const name of names) {
        if (!name.startsWith(root) || name.endsWith('/')) continue

        const relative = name.slice(root.length)

        if (!relative || shouldSkip(relative)) continue

        const destination = path.resolve(projectRoot, relative)
        const check = path.relative(projectRoot, destination)

        if (check.startsWith('..') || path.isAbsolute(check)) continue

        fs.mkdirSync(path.dirname(destination), { recursive: true })
        fs.writeFileSync(destination, Buffer.from(files[name]))
        updated++
    }

    return `Updated ${updated} file(s) from ${repo.owner}/${repo.name}@${branch}.`
}

let handler = async (m) => {
    try {
        const repo = getRepo()

        if (isGitRepo()) {
            try {
                const result = await updateWithGit(repo)

                return await m.reply(
                    `*Update complete*\n\n${result}\n\nRestart the bot to apply the updates.`
                )
            } catch (error) {
                const output = `${error.stdout || ''}\n${error.stderr || ''}\n${error.message || ''}`

                if (
                    !/not a git repository/i.test(output) &&
                    !/could not resolve host/i.test(output) &&
                    !/repository not found/i.test(output) &&
                    !/couldn't find remote ref/i.test(output)
                ) {
                    return await m.reply(
                        `*Update failed*\n\n${output.trim().slice(-3000)}`
                    )
                }
            }
        }

        const result = await updateWithZip(repo)

        await m.reply(
            `*Update complete*\n\n${result}\n\nRestart the bot to apply the updates.`
        )
    } catch (error) {
        const output =
            error.stderr ||
            error.stdout ||
            error.message ||
            String(error)

        await m.reply(
            `*Update failed*\n\n${output.slice(-3000)}`
        )
    }
}

handler.command = ['update']
handler.owner = true

export default handler
