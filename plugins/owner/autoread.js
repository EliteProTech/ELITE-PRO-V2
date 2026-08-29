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
        return await m.reply(`Auto-read is *${global.autoRead ? 'ON' : 'OFF'}*.\n\nUsage: ${global.prefix || ''}autoread on | off`)
    }

    const enabled = choice === 'on' || choice === 'enable'
    global.autoRead = enabled
    const settings = readSettings()
    settings.autoRead = enabled
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))

    await m.reply(`Auto-read is now *${enabled ? 'ON' : 'OFF'}*.`)
}

handler.command = ['autoread']
handler.owner = true

export default handler
