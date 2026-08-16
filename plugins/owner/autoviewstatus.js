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

    if (choice !== 'on' && choice !== 'off') {
        return await m.reply(`Auto view status is currently *${global.autoViewStatus ? 'on' : 'off'}*.\n\nUsage: .autoviewstatus on | .autoviewstatus off`)
    }

    global.autoViewStatus = choice === 'on'

    const settings = readSettings()
    settings.autoViewStatus = global.autoViewStatus
    writeSettings(settings)

    await m.reply(`Auto view status turned *${choice}*.`)
}

handler.command = ['autoviewstatus', 'avs']
handler.owner = true

export default handler
