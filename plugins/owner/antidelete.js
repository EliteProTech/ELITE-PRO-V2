import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const SETTINGS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'database', 'settings.json')

const saveSettings = () => {
    let settings = {}
    try {
        settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'))
    } catch {}

    settings.antiDelete = global.antiDelete === true
    settings.antiDeleteMode = global.antiDeleteMode === 'chat' ? 'chat' : 'dm'
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))
}

let handler = async (m, { args }) => {
    const action = String(args[0] || '').toLowerCase()
    const mode = String(args[1] || '').toLowerCase()

    if (!action) {
        const status = global.antiDelete ? 'ON' : 'OFF'
        const destination = global.antiDeleteMode === 'chat' ? 'the chat where it was deleted' : 'the owner DM'
        return await m.reply(`Anti-delete: *${status}*\nDestination: *${destination}*\n\nUsage:\n${global.prefix || ''}antidelete on [dm|chat]\n${global.prefix || ''}antidelete off`)
    }

    if (action === 'off' && !mode) {
        global.antiDelete = false
        saveSettings()
        return await m.reply('Anti-delete is now *OFF*.')
    }

    if (action !== 'on' || (mode && !['dm', 'chat'].includes(mode))) {
        return await m.reply(`Usage: ${global.prefix || ''}antidelete on [dm|chat] or ${global.prefix || ''}antidelete off`)
    }

    global.antiDelete = true
    global.antiDeleteMode = mode || 'dm'
    saveSettings()
    return await m.reply(`Anti-delete is now *ON*. Deleted messages will be sent to *${global.antiDeleteMode === 'chat' ? 'the same chat' : 'your DM'}*.`)
}

handler.command = ['antidelete', 'antidel']
handler.owner = true

export default handler
