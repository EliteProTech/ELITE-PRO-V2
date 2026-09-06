import { getGroupMetadata } from '../../lib/myfunc.js'
import { getGroupSettings, updateGroupSettings } from '../../lib/groupsettings.js'

const antiLinkModes = new Map([
    ['off', 'off'],
    ['delete', 'delete'],
    ['warn', 'warn'],
    ['deletewarn', 'deletewarn'],
    ['warnkick', 'warnkick'],
    ['deletekick', 'deletekick'],
    ['deletewarnkick', 'deletewarnkick']
])

const onOff = value => ['on', 'off'].includes(value) ? value === 'on' : null

let handler = async (m, { EliteProTech, args, text, command }) => {
    const settings = getGroupSettings(m.chat)

    if (command === 'groupsettings' || command === 'gsettings') {
        const metadata = await getGroupMetadata(EliteProTech, m.chat, true)
        const members = metadata?.participants || []
        const pending = metadata?.requestParticipants?.length || metadata?.pendingParticipants?.length || 0
        const status = metadata?.announce ? 'Closed' : 'Open'
        const muted = metadata?.announce ? 'ON (admins only)' : 'OFF'
        const infoEdit = metadata?.restrict ? 'Admins only' : 'All members'
        const memberAdd = metadata?.memberAddMode === false ? 'Admins only' : 'All members'
        return await m.reply(
            `*Group Settings*\n\n` +
            `Title: *${metadata?.subject || 'Unknown'}*\n` +
            `Members: *${members.length}*\n` +
            `Mute: *${muted}*\n` +
            `Status: *${status}*\n` +
            `Pending requests: *${pending}*\n` +
            `Edit group info: *${infoEdit}*\n` +
            `Add members: *${memberAdd}*\n\n` +
            `*Automations*\n` +
            `Welcome: *${settings.welcome ? 'ON' : 'OFF'}*\n` +
            `Goodbye: *${settings.goodbye ? 'ON' : 'OFF'}*\n` +
            `Anti-link: *${settings.antiLink}*\n` +
            `Anti-group-status: *${settings.antiGroupStatus}*\n\n` +
            `*Controls*\n` +
            `${global.prefix || ''}group open | close\n\n` +
            `Anti-link modes:\n` +
            `${global.prefix || ''}antilink off | delete | warn | deletewarn | warnkick | deletekick | deletewarnkick [warning limit]\n\n` +
            `${global.prefix || ''}antigroupstatus off | delete | warn | warnkick | kick [warning limit]\n\n` +
            `Welcome/goodbye:\n` +
            `${global.prefix || ''}welcome on|off\n` +
            `${global.prefix || ''}goodbye on|off\n` +
            `${global.prefix || ''}setwelcome <text>\n` +
            `${global.prefix || ''}setgoodbye <text>\n\n` +
            `Template variables: {user}, {group}, {count}`
        )
    }

    if (command === 'antilink') {
        const mode = antiLinkModes.get(args[0]?.toLowerCase())
        if (!mode) return await m.reply(`Usage: ${global.prefix || ''}antilink off | delete | warn | deletewarn | warnkick | deletekick | deletewarnkick [warning limit]`)
        const limit = args[1] === undefined ? settings.antiLinkLimit : Number.parseInt(args[1], 10)
        if (!Number.isInteger(limit) || limit < 1 || limit > 10) return await m.reply('Warning limit must be from 1 to 10.')
        updateGroupSettings(m.chat, { antiLink: mode, antiLinkLimit: limit, antiLinkUsers: {} })
        return await m.reply(`Anti-link mode set to *${mode}*${mode.includes('kick') && mode.includes('warn') ? ` with a *${limit}* warning limit` : ''}.`)
    }

    if (command === 'antigroupstatus' || command === 'antistatus') {
        const mode = antiLinkModes.get(args[0]?.toLowerCase())
        if (!mode || !['off', 'delete', 'warn', 'warnkick', 'kick'].includes(mode)) {
            return await m.reply(`Usage: ${global.prefix || ''}antigroupstatus off | delete | warn | warnkick | kick [warning limit]`)
        }
        const limit = args[1] === undefined ? settings.antiGroupStatusLimit : Number.parseInt(args[1], 10)
        if (!Number.isInteger(limit) || limit < 1 || limit > 10) return await m.reply('Warning limit must be from 1 to 10.')
        updateGroupSettings(m.chat, {
            antiGroupStatus: mode,
            antiGroupStatusLimit: limit,
            antiGroupStatusUsers: {}
        })
        return await m.reply(`Anti-group-status mode set to *${mode}*${mode === 'warnkick' ? ` with a *${limit}* warning limit` : ''}.`)
    }

    if (command === 'welcome' || command === 'goodbye') {
        const enabled = onOff(args[0]?.toLowerCase())
        if (enabled === null) return await m.reply(`Usage: ${global.prefix || ''}${command} on | off`)
        updateGroupSettings(m.chat, { [command]: enabled })
        return await m.reply(`${command === 'welcome' ? 'Welcome' : 'Goodbye'} messages turned *${enabled ? 'ON' : 'OFF'}*.`)
    }

    const key = command === 'setwelcome' ? 'welcomeMessage' : 'goodbyeMessage'
    if (!text.trim() || text.length > 2000) return await m.reply(`Usage: ${global.prefix || ''}${command} <text up to 2000 characters>`)
    updateGroupSettings(m.chat, { [key]: text.trim() })
    await m.reply(`${command === 'setwelcome' ? 'Welcome' : 'Goodbye'} message updated.`)
}

handler.command = ['antilink', 'antigroupstatus', 'antistatus', 'welcome', 'goodbye', 'setwelcome', 'setgoodbye', 'groupsettings', 'gsettings']
handler.group = true
handler.admin = true
handler.ownerBypassAdmin = true

export default handler
