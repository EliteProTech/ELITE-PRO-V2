import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const SETTINGS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'database', 'settings.json')

function readSettings() {
    try {
        return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'))
    } catch {
        return {}
    }
}

function saveSettings() {
    const settings = readSettings()
    settings.autoReact = global.autoReact
    settings.autoReactEmojis = global.autoReactEmojis
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))
}

const parseEmojis = value => String(value || '')
    .split(',')
    .map(emoji => emoji.trim())
    .filter(Boolean)
    .slice(0, 20)

let handler = async (m, { args }) => {
    const choice = args[0]?.toLowerCase()

    if (!choice) {
        return await m.reply(
            `Auto-react is *${global.autoReact ? 'ON' : 'OFF'}*.\nReactions: ${global.autoReactEmojis?.join(' ') || '💚'}\n\n` +
            `Usage:\n${global.prefix || ''}autoreact on [🥰,😍]\n${global.prefix || ''}autoreact off\n${global.prefix || ''}autoreact emoji 🥰,😍`
        )
    }

    if (choice === 'emoji') {
        const emojis = parseEmojis(args.slice(1).join(' '))
        if (!emojis.length) return await m.reply(`Usage: ${global.prefix || ''}autoreact emoji 🥰,😍`)
        global.autoReactEmojis = emojis
        saveSettings()
        return await m.reply(`Auto-react reactions set to: ${emojis.join(' ')}`)
    }

    if (!['on', 'off'].includes(choice)) {
        return await m.reply(`Usage: ${global.prefix || ''}autoreact on [🥰,😍] | off | emoji 🥰,😍`)
    }

    const emojis = parseEmojis(args.slice(1).join(' '))
    if (emojis.length) global.autoReactEmojis = emojis
    global.autoReact = choice === 'on'
    saveSettings()
    await m.reply(`Auto-react is now *${global.autoReact ? 'ON' : 'OFF'}*.\nReactions: ${global.autoReactEmojis?.join(' ') || '💚'}`)
}

handler.command = ['autoreact']
handler.owner = true

export default handler
