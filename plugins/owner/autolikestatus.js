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

function writeSettings(data) {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2))
}

let handler = async (m, { args }) => {
    const choice = args[0]?.toLowerCase()
    const parseEmojis = value => value.split(',').map(emoji => emoji.trim()).filter(Boolean).slice(0, 20)

    if (choice === 'emoji') {
        const emojis = parseEmojis(args.slice(1).join(' '))
        if (!emojis.length) return await m.reply(`Usage: ${global.prefix || ''}autolike emoji 🥰,😍`)

        global.autoLikeStatusEmojis = emojis
        const settings = readSettings()
        settings.autoLikeStatusEmojis = emojis
        writeSettings(settings)
        return await m.reply(`Auto-like reactions set to: ${emojis.join(' ')}`)
    }

    if (choice && choice !== 'on' && choice !== 'off') {
        return await m.reply(`Current auto-like status: *${global.autoLikeStatus ? 'ON' : 'OFF'}*\nReactions: ${global.autoLikeStatusEmojis?.join(' ') || '💚'}\n\nUsage:\n${global.prefix || ''}autolike on [🥰,😍]\n${global.prefix || ''}autolike off\n${global.prefix || ''}autolike emoji 🥰,😍`)
    }

    const next = choice ? choice === 'on' : !global.autoLikeStatus
    const rawEmojis = args.slice(1).join(' ').trim()
    const emojis = rawEmojis ? parseEmojis(rawEmojis) : global.autoLikeStatusEmojis || ['💚']
    if (rawEmojis && !emojis.length) return await m.reply('Provide at least one reaction emoji.')
    global.autoLikeStatus = next
    global.autoLikeStatusEmojis = emojis

    const settings = readSettings()
    settings.autoLikeStatus = next
    settings.autoLikeStatusEmojis = emojis
    writeSettings(settings)

    await m.reply(`Auto-like status is now *${next ? 'ON' : 'OFF'}*.\nReactions: ${emojis.join(' ')}`)
}

handler.command = ['autolike', 'autolikestatus']
handler.owner = true

export default handler
