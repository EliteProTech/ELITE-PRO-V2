import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'

const execFileAsync = promisify(execFile)
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

let handler = async (m) => {
    try {
        const { stdout: branchOutput } = await execFileAsync('git', ['-C', projectRoot, 'branch', '--show-current'])
        const branch = branchOutput.trim() || 'main'
        const { stdout, stderr } = await execFileAsync('git', [
            '-C', projectRoot,
            'pull',
            '--ff-only',
            global.repo,
            branch
        ], { maxBuffer: 1024 * 1024 })

        const result = (stdout || stderr || 'Already up to date.').trim()
        await m.reply(`*Update complete*\n\n${result.slice(-3000)}\n\nRestart the bot to load updates to core files.`)
    } catch (error) {
        const result = error.stderr || error.stdout || error.message || String(error)
        await m.reply(`*Update failed*\n\n${result.slice(-3000)}`)
    }
}

handler.command = ['update']
handler.owner = true

export default handler
