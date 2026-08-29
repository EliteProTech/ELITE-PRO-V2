import fs from 'fs'
import path from 'path'

const SETTINGS_PATH = path.join(process.cwd(), 'lib', 'database', 'settings.json')

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

    if (!choice) {
        return await m.reply(`Current mode: *${global.botMode}*\n\nUsage: ${global.prefix || ''}mode self | ${global.prefix || ''}mode public`)
    }

    if (choice !== 'self' && choice !== 'public') {
        return await m.reply(`Invalid mode. Usage: ${global.prefix || ''}mode self | ${global.prefix || ''}mode public`)
    }

    global.botMode = choice

    const settings = readSettings()
    settings.mode = choice
    writeSettings(settings)

    await m.reply(`Bot mode set to *${choice}*.${choice === 'self' ? ' Only the owner can use commands now.' : ' Anyone can use commands now.'}`)
}

handler.command = ['mode']
handler.owner = true

export default handler
