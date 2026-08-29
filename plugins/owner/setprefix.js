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

let handler = async (m, { text }) => {
    const value = text.trim()

    if (!value) {
        return await m.reply(`Current prefix: *${global.prefix || 'none'}*\n\nUsage: ${global.prefix || ''}setprefix <prefix>\nUse \`none\` for no prefix.`)
    }

    const prefix = value.toLowerCase() === 'none' ? '' : value
    if (/\s/.test(prefix) || prefix.length > 8) {
        return await m.reply('The prefix must not contain spaces and can be at most 8 characters.')
    }

    global.prefix = prefix
    const settings = readSettings()
    settings.prefix = prefix
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))

    await m.reply(`Prefix set to *${prefix || 'none'}*`)
}

handler.command = ['setprefix']
handler.owner = true

export default handler
