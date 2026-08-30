import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import axios from 'axios'
import { unzipSync } from 'fflate'
import { fileURLToPath } from 'url'

const execFileAsync = promisify(execFile)
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const SKIP_PREFIXES = ['session/', 'lib/database/', 'node_modules/', '.git/', 'config.js']

function shouldSkip(relPath) {
    return SKIP_PREFIXES.some(prefix => relPath === prefix || relPath.startsWith(prefix))
}

function parseRepo(repoUrl) {
    const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+?)(\.git)?$/)
    if (!match) throw new Error('Could not parse owner/repo from global.repo')
    return { owner: match[1], repo: match[2] }
}

async function updateViaGit() {
    const { stdout: statusOutput } = await execFileAsync('git', ['-C', projectRoot, 'status', '--porcelain'])
    if (statusOutput.trim()) {
        throw new Error('Update cancelled because this bot has uncommitted local changes. Commit or stash them before running update.')
    }
    const { stdout: branchOutput } = await execFileAsync('git', ['-C', projectRoot, 'branch', '--show-current'])
    const branch = branchOutput.trim() || 'main'
    const { stdout, stderr } = await execFileAsync('git', [
        '-C', projectRoot,
        'pull',
        '--ff-only',
        global.repo,
        branch
    ], { maxBuffer: 1024 * 1024 })
    return (stdout || stderr || 'Already up to date.').trim()
}

async function updateViaZip() {
    const { owner, repo } = parseRepo(global.repo)
    let branch = 'main'
    let zipRes

    try {
        zipRes = await axios.get(`https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`, {
            responseType: 'arraybuffer'
        })
    } catch {
        branch = 'master'
        zipRes = await axios.get(`https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`, {
            responseType: 'arraybuffer'
        })
    }

    const entries = unzipSync(new Uint8Array(zipRes.data))
    const names = Object.keys(entries)
    if (!names.length) throw new Error('Downloaded archive was empty')

    const rootFolder = names[0].split('/')[0] + '/'
    let written = 0

    for (const name of names) {
        if (!name.startsWith(rootFolder) || name.endsWith('/')) continue
        const relPath = name.slice(rootFolder.length)
        if (!relPath || shouldSkip(relPath)) continue

        const destPath = path.join(projectRoot, relPath)
        const relativeDest = path.relative(projectRoot, destPath)
        if (relativeDest.startsWith('..') || path.isAbsolute(relativeDest)) continue
        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        fs.writeFileSync(destPath, Buffer.from(entries[name]))
        written++
    }

    return `Updated ${written} file(s) from ${owner}/${repo}@${branch} (downloaded, git not available).`
}

let handler = async (m) => {
    try {
        const result = await updateViaGit()
        await m.reply(`*Update complete*\n\n${result.slice(-3000)}\n\nRestart the bot to load updates to core files.`)
    } catch (error) {
        if (error.code === 'ENOENT') {
            try {
                const result = await updateViaZip()
                return await m.reply(`*Update complete (fallback)*\n\n${result}\n\nRestart the bot to load updates to core files.`)
            } catch (zipError) {
                return await m.reply(`*Update failed*\n\ngit is not installed on this platform, and the fallback download also failed:\n${zipError.message || String(zipError)}`)
            }
        }
        const result = error.stderr || error.stdout || error.message || String(error)
        await m.reply(`*Update failed*\n\n${result.slice(-3000)}`)
    }
}

handler.command = ['update']
handler.owner = true

export default handler
