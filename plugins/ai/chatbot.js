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
    if (!choice || !['on', 'off'].includes(choice)) {
        return await m.reply(
            `Chatbot is *${global.chatbotEnabled ? 'ON' : 'OFF'}*.\n` +
            `When enabled, it replies to text in DMs and when mentioned or replied to in groups.\n\n` +
            `Usage: ${global.prefix || ''}chatbot on | off`
        )
    }

    global.chatbotEnabled = choice === 'on'
    const settings = readSettings()
    settings.chatbotEnabled = global.chatbotEnabled
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))

    return await m.reply(`Chatbot is now *${global.chatbotEnabled ? 'ON' : 'OFF'}*.`)
}

handler.command = ['chatbot']
handler.owner = true

export default handler
