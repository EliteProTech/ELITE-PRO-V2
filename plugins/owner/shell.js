import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const TIMEOUT_MS = 30000

let handler = async (m, { text }) => {
    const command = text?.trim()

    if (!command) {
        return await m.reply('Provide a shell command to run.\nUsage: $ls -la')
    }

    try {
        const { stdout, stderr } = await execAsync(command, {
            timeout: TIMEOUT_MS,
            maxBuffer: 20 * 1024 * 1024
        })

        let output = (stdout || '') + (stderr ? `\n${stderr}` : '')
        output = output.trim() || '(no output)'

        await m.reply(output)
    } catch (e) {
        const errMsg = e.killed
            ? `Command timed out after ${TIMEOUT_MS / 1000}s`
            : (e.stderr || e.message || String(e))
        await m.reply(errMsg)
    }
}

handler.customPrefix = /^\$/
handler.owner = true
handler.silentDeny = true

export default handler
