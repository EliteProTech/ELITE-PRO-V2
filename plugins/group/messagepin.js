const PIN_DURATIONS = {
    '24h': 86400,
    '7d': 604800,
    '30d': 2592000
}

let handler = async (m, { EliteProTech, args, command }) => {
    const quoted = m.quoted
    if (!quoted?.id) return await m.reply(`Reply to the message to ${command === 'pinmsg' ? 'pin' : 'unpin'}.`)

    const key = quoted.fakeObj?.key || {
        remoteJid: m.chat,
        fromMe: Boolean(quoted.fromMe),
        id: quoted.id,
        participant: quoted.participant
    }
    const type = command === 'pinmsg' ? 1 : 2
    const duration = PIN_DURATIONS[String(args[0] || '24h').toLowerCase()]
    if (command === 'pinmsg' && !duration) {
        return await m.reply(`Usage: ${global.prefix || '.'}pinmsg [24h|7d|30d]`)
    }

    try {
        await EliteProTech.sendMessage(m.chat, {
            pin: key,
            type,
            ...(type === 1 ? { time: duration } : {})
        }, { quoted: m })
        return await m.reply(command === 'pinmsg'
            ? `Message pinned for ${args[0] || '24h'}.`
            : 'Message unpinned.')
    } catch (error) {
        return await m.reply(`Could not ${command === 'pinmsg' ? 'pin' : 'unpin'} that message: ${error.message || String(error)}`)
    }
}

handler.command = ['pinmsg', 'unpinmsg']

export default handler
