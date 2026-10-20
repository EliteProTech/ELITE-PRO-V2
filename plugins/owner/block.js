let handler = async (m, { EliteProTech, args, command }) => {
    let target = m.quoted?.sender || m.mentionedJid?.[0] || ''
    if (!target) {
        const number = String(args[0] || '').replace(/\D/g, '')
        if (number.length < 7 || number.length > 15) {
            return await m.reply(`Usage: ${global.prefix || '.'}${command} <number>\nOr reply to/mention the person.`)
        }
        target = `${number}@s.whatsapp.net`
    }

    target = EliteProTech.decodeJid(target)
    if (target === EliteProTech.decodeJid(EliteProTech.user.id)) {
        return await m.reply('You cannot block or unblock the bot’s own account.')
    }
    if (!/@(?:s\.whatsapp\.net|lid)$/.test(target)) {
        return await m.reply('That does not look like a valid WhatsApp user.')
    }

    try {
        const action = command === 'block' ? 'block' : 'unblock'
        await EliteProTech.updateBlockStatus(target, action)
        return await m.reply(`User ${action === 'block' ? 'blocked' : 'unblocked'}: @${target.split('@')[0]}`)
    } catch (error) {
        return await m.reply(`Could not ${command} that user: ${error.message || String(error)}`)
    }
}

handler.command = ['block', 'unblock']
handler.owner = true
handler.silentDeny = true

export default handler
