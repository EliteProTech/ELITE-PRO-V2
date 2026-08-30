import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const SETTINGS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'lib', 'database', 'settings.json')

function readSettings() {
    try {
        return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'))
    } catch {
        return {}
    }
}

let handler = async (m, { args }) => {
    const choice = args[0]?.toLowerCase()
    if (!choice || !['on', 'off', 'enable', 'disable'].includes(choice)) {
        const state = global.autoViewStatus && global.autoLikeStatus ? 'ON' : 'OFF'
        return await m.reply(`Auto-view and auto-like status are *${state}*.\n\nUsage: ${global.prefix || ''}autoviewlike on | off`)
    }

    const enabled = choice === 'on' || choice === 'enable'
    global.autoViewStatus = enabled
    global.autoLikeStatus = enabled

    const settings = readSettings()
    settings.autoViewStatus = enabled
    settings.autoLikeStatus = enabled
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))

    await m.reply(`Auto-view and auto-like status are now *${enabled ? 'ON' : 'OFF'}*.`)
}

handler.command = ['autoviewlike', 'avl']
handler.owner = true

export default handler
