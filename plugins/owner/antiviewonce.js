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
    settings.antiViewOnceGlobal = global.antiViewOnceGlobal
    settings.antiViewOnceGroups = global.antiViewOnceGroups
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))
}

let handler = async (m, { args }) => {
    const action = args[0]?.toLowerCase()
    const option = args[1]?.toLowerCase()
    const isGroup = m.isGroup

    if (!action) {
        const current = isGroup
            ? global.antiViewOnceGroups?.[m.chat] || 'off'
            : global.antiViewOnceGlobal ? 'on' : 'off'
        const usage = isGroup
            ? `${global.prefix || ''}antiviewonce on\n${global.prefix || ''}antiviewonce on chat\n${global.prefix || ''}antiviewonce off\n${global.prefix || ''}antiviewonce off all`
            : `${global.prefix || ''}antiviewonce on\n${global.prefix || ''}antiviewonce off\n${global.prefix || ''}antiviewonce off all`
        return await m.reply(`Anti-view-once: *${current.toUpperCase()}*\n\n${isGroup ? 'This group can send opened media to your DM by default, or to this group with *on chat*.' : 'DM mode watches both DMs and groups, forwarding opened media to your DM.'}\n\nUsage:\n${usage}`)
    }

    if (!['on', 'off'].includes(action) || (option && option !== 'chat' && !(action === 'off' && option === 'all'))) {
        return await m.reply(`Invalid option. Send *${global.prefix || ''}antiviewonce* to view the available options.`)
    }

    global.antiViewOnceGroups ??= {}
    if (action === 'off' && option === 'all') {
        global.antiViewOnceGlobal = false
        global.antiViewOnceGroups = {}
        saveSettings()
        return await m.reply('Anti-view-once is now *OFF* everywhere.')
    }

    if (!isGroup) {
        global.antiViewOnceGlobal = action === 'on'
        saveSettings()
        return await m.reply(global.antiViewOnceGlobal
            ? 'Anti-view-once is *ON*. View-once media from DMs and groups will be sent to your DM.'
            : 'Global anti-view-once is now *OFF*. Group rules remain unchanged.')
    }

    if (action === 'on') {
        global.antiViewOnceGroups[m.chat] = option === 'chat' ? 'chat' : 'dm'
        saveSettings()
        return await m.reply(`Anti-view-once is *ON* for this group. Opened media will be sent to ${option === 'chat' ? '*this group*' : '*your DM*'}.`)
    }

    global.antiViewOnceGroups[m.chat] = 'off'
    saveSettings()
    await m.reply('Anti-view-once is now *OFF* for this group.')
}

handler.command = ['antiviewonce', 'avo']
handler.owner = true

export default handler
