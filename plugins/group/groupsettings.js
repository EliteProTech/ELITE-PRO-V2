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

let handler = async (m, { args, text, command }) => {
    const settings = getGroupSettings(m.chat)

    if (command === 'groupsettings' || command === 'gsettings') {
        return await m.reply(
            `*Group Settings*\n\n` +
            `Anti-link: *${settings.antiLink}*\n` +
            `Welcome: *${settings.welcome ? 'ON' : 'OFF'}*\n` +
            `Goodbye: *${settings.goodbye ? 'ON' : 'OFF'}*\n\n` +
            `Anti-link modes:\n` +
            `${global.prefix || ''}antilink off | delete | warn | deletewarn | warnkick | deletekick | deletewarnkick\n\n` +
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
        if (!mode) return await m.reply(`Usage: ${global.prefix || ''}antilink off | delete | warn | deletewarn | warnkick | deletekick | deletewarnkick`)
        updateGroupSettings(m.chat, { antiLink: mode })
        return await m.reply(`Anti-link mode set to *${mode}*.`)
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

handler.command = ['antilink', 'welcome', 'goodbye', 'setwelcome', 'setgoodbye', 'groupsettings', 'gsettings']
handler.group = true
handler.admin = true
handler.ownerBypassAdmin = true

export default handler
