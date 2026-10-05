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

const moderationModes = new Map([
    ...antiLinkModes,
    ['kick', 'kick']
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
            `Anti-bot commands: *${settings.antiBot}*\n` +
            `Anti-badword: *${settings.antiBadWord}* (${settings.badWords.length} word${settings.badWords.length === 1 ? '' : 's'})\n` +
            `Group event notices: *${settings.antiGroupEvents ? 'ON' : 'OFF'}*\n\n` +
            `*Controls*\n` +
            `${global.prefix || ''}group open | close\n\n` +
            `Anti-link modes:\n` +
            `${global.prefix || ''}antilink off | delete | warn | deletewarn | warnkick | deletekick | deletewarnkick [warning limit]\n\n` +
            `${global.prefix || ''}antigroupstatus off | delete | warn | warnkick | kick [warning limit]\n\n` +
            `${global.prefix || ''}antibot off | delete | warn | deletewarn | warnkick | deletewarnkick | kick [warning limit]\n` +
            `${global.prefix || ''}antibadword off | delete | warn | deletewarn | warnkick | deletewarnkick | kick [warning limit]\n` +
            `${global.prefix || ''}badword add | del | list | clear <word>\n` +
            `${global.prefix || ''}antigroup on | off\n` +
            `${global.prefix || ''}joinapproval on | off\n\n` +
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

    if (command === 'antibot' || command === 'antibadword') {
        const mode = moderationModes.get(args[0]?.toLowerCase())
        if (!mode) {
            return await m.reply(`Usage: ${global.prefix || ''}${command} off | delete | warn | deletewarn | warnkick | deletewarnkick | kick [warning limit]`)
        }
        const isBotRule = command === 'antibot'
        const limit = args[1] === undefined
            ? (isBotRule ? settings.antiBotLimit : settings.antiBadWordLimit)
            : Number.parseInt(args[1], 10)
        if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
            return await m.reply('Warning limit must be from 1 to 10.')
        }
        updateGroupSettings(m.chat, isBotRule
            ? { antiBot: mode, antiBotLimit: limit, antiBotUsers: {} }
            : { antiBadWord: mode, antiBadWordLimit: limit, antiBadWordUsers: {} }
        )
        return await m.reply(`${isBotRule ? 'Anti-bot command filter' : 'Anti-badword'} mode set to *${mode}*${mode.includes('warn') ? ` with a *${limit}* warning limit` : ''}.`)
    }

    if (command === 'badword') {
        const action = args.shift()?.toLowerCase()
        const words = [...new Set((settings.badWords || []).map(word => String(word).toLowerCase()))]

        if (action === 'list') {
            return await m.reply(words.length ? `*Blocked words (${words.length})*\n\n${words.map(word => `• ${word}`).join('\n')}` : 'No bad words are configured.')
        }
        if (action === 'clear') {
            updateGroupSettings(m.chat, { badWords: [], antiBadWordUsers: {} })
            return await m.reply('Blocked-word list cleared.')
        }

        const value = args.join(' ').trim().toLowerCase()
        if (!['add', 'del', 'delete', 'remove'].includes(action) || !value) {
            return await m.reply(`Usage: ${global.prefix || ''}badword add <word or phrase>\n${global.prefix || ''}badword del <word or phrase>\n${global.prefix || ''}badword list | clear`)
        }
        if (value.length > 80) return await m.reply('A blocked word or phrase can be at most 80 characters.')

        if (action === 'add') {
            if (words.includes(value)) return await m.reply('That word or phrase is already blocked.')
            if (words.length >= 100) return await m.reply('The blocked-word list is limited to 100 entries.')
            words.push(value)
            updateGroupSettings(m.chat, { badWords: words })
            return await m.reply(`Blocked word added: *${value}*`)
        }

        const nextWords = words.filter(word => word !== value)
        if (nextWords.length === words.length) return await m.reply('That word or phrase is not in the blocked list.')
        updateGroupSettings(m.chat, { badWords: nextWords })
        return await m.reply(`Blocked word removed: *${value}*`)
    }

    if (command === 'antigroup') {
        const enabled = onOff(args[0]?.toLowerCase())
        if (enabled === null) return await m.reply(`Usage: ${global.prefix || ''}antigroup on | off`)
        updateGroupSettings(m.chat, { antiGroupEvents: enabled })
        return await m.reply(`Group event notices turned *${enabled ? 'ON' : 'OFF'}*.`)
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

handler.command = ['antilink', 'antigroupstatus', 'antistatus', 'antibot', 'antibadword', 'badword', 'antigroup', 'welcome', 'goodbye', 'setwelcome', 'setgoodbye', 'groupsettings', 'gsettings']
handler.group = true
handler.admin = true
handler.ownerBypassAdmin = true

export default handler
