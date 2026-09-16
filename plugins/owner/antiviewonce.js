import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const SETTINGS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'database', 'settings.json')
const SCOPES = new Set(['dm', 'group', 'all'])

function readSettings() {
    try {
        return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'))
    } catch {
        return {}
    }
}

let handler = async (m, { args }) => {
    const action = args[0]?.toLowerCase()
    const requestedScope = args[1]?.toLowerCase()

    if (!action || !['on', 'off'].includes(action) || (requestedScope && !SCOPES.has(requestedScope))) {
        const current = global.antiViewOnceScope || 'off'
        return await m.reply(`Anti-view-once: *${current}*\n\nUsage:\n${global.prefix || ''}antiviewonce on [dm|group|all]\n${global.prefix || ''}antiviewonce off\n\nDefault scope is *dm*.`)
    }

    global.antiViewOnceScope = action === 'off' ? null : (requestedScope || 'dm')
    const settings = readSettings()
    settings.antiViewOnceScope = global.antiViewOnceScope
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))

    await m.reply(global.antiViewOnceScope
        ? `Anti-view-once is *ON* for *${global.antiViewOnceScope}* messages. Media will be sent to your DM.`
        : 'Anti-view-once is now *OFF*.')
}

handler.command = ['antiviewonce', 'avo']
handler.owner = true

export default handler
