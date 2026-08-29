import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const SETTINGS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'lib', 'database', 'settings.json')

const settingsKey = {
    autorecording: 'autoRecording',
    autotyping: 'autoTyping',
    autorecordtype: 'autoRecordType'
}

const label = {
    autorecording: 'Auto-recording',
    autotyping: 'Auto-typing',
    autorecordtype: 'Auto-record/type'
}

function readSettings() {
    try {
        return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'))
    } catch {
        return {}
    }
}

let handler = async (m, { args, command }) => {
    const choice = args[0]?.toLowerCase()
    const key = settingsKey[command]

    if (!choice || !['on', 'off', 'enable', 'disable'].includes(choice)) {
        return await m.reply(`${label[command]} is *${global[key] ? 'ON' : 'OFF'}*.\n\nUsage: ${global.prefix || ''}${command} on | off`)
    }

    const enabled = choice === 'on' || choice === 'enable'
    global[key] = enabled
    const settings = readSettings()
    settings[key] = enabled
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))

    await m.reply(`${label[command]} is now *${enabled ? 'ON' : 'OFF'}*.`)
}

handler.command = ['autorecording', 'autotyping', 'autorecordtype']
handler.owner = true

export default handler
