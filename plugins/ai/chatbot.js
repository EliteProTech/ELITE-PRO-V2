import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const SETTINGS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'database', 'settings.json')

function readSettings() {
    try {
        return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'))
    } catch {
        return {}
    }
}

let handler = async (m, { args }) => {
    const choice = args[0]?.toLowerCase()
    const modes = new Set(['dm', 'group', 'all', 'mention', 'off'])
    if (!choice || (!modes.has(choice) && choice !== 'on')) {
        return await m.reply(
            `Chatbot mode: *${global.chatbotMode || 'off'}*.\n\n` +
            `Usage: ${global.prefix || ''}chatbot dm | group | all | mention | off\n` +
            `• dm: answer in private chats\n` +
            `• group: answer every group message\n` +
            `• all: answer in DMs and groups\n` +
            `• mention: answer when mentioned or replied to in groups`
        )
    }

    global.chatbotMode = choice === 'on' ? 'all' : choice
    const settings = readSettings()
    delete settings.chatbotEnabled
    settings.chatbotMode = global.chatbotMode
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))

    return await m.reply(`Chatbot mode set to *${global.chatbotMode}*.`)
}

handler.command = ['chatbot']
handler.owner = true

export default handler
