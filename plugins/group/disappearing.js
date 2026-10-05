const DURATIONS = {
    off: 0,
    '24h': 24 * 60 * 60,
    '7d': 7 * 24 * 60 * 60,
    '90d': 90 * 24 * 60 * 60
}

let handler = async (m, { EliteProTech, args }) => {
    const choice = args[0]?.toLowerCase()
    if (!Object.hasOwn(DURATIONS, choice)) {
        return await m.reply(`Usage: ${global.prefix || ''}disappearing off | 24h | 7d | 90d`)
    }

    try {
        await EliteProTech.groupToggleEphemeral(m.chat, DURATIONS[choice])
        await m.reply(`Disappearing messages are now *${choice === 'off' ? 'OFF' : `set to ${choice}`}*.`)
    } catch (error) {
        await m.reply(`Unable to update disappearing messages: ${error.message || String(error)}`)
    }
}

handler.command = ['disappearing', 'disappear', 'ephemeral']
handler.group = true
handler.admin = true
handler.isBotAdmin = true

export default handler
