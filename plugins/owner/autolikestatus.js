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

function writeSettings(data) {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2))
}

let handler = async (m, { args }) => {
    const choice = args[0]?.toLowerCase()

    if (choice && choice !== 'on' && choice !== 'off') {
        return await m.reply(`Current auto-like status: *${global.autoLikeStatus ? 'ON' : 'OFF'}*\n\nUsage: .autolike on | .autolike off`)
    }

    const next = choice ? choice === 'on' : !global.autoLikeStatus
    global.autoLikeStatus = next

    const settings = readSettings()
    settings.autoLikeStatus = next
    writeSettings(settings)

    await m.reply(`Auto-like status is now *${next ? 'ON' : 'OFF'}*.`)
}

handler.command = ['autolike', 'autolikestatus']
handler.owner = true

export default handler
