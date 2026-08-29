function targetsFromMessage(m, args) {
    const targets = new Set([...(m.mentionedJid || [])])
    if (m.quoted?.sender) targets.add(m.quoted.sender)

    for (const value of args) {
        const number = value.replace(/\D/g, '')
        if (number) targets.add(`${number}@s.whatsapp.net`)
    }
    return [...targets]
}

let handler = async (m, { EliteProTech, args, command }) => {
    const targets = targetsFromMessage(m, args)
    if (!targets.length) {
        return await m.reply(`Reply to a member, mention them, or provide their number.\n\nUsage: ${global.prefix || ''}${command} @user`)
    }

    const action = command === 'add' ? 'add' : 'remove'
    try {
        const result = await EliteProTech.groupParticipantsUpdate(m.chat, targets, action)
        const failed = result.filter(item => item.status && item.status !== '200')
        if (failed.length) return await m.reply(`Unable to ${action} ${failed.length} member(s).`)
        await m.reply(`${action === 'add' ? 'Added' : 'Removed'} ${targets.length} member(s).`)
    } catch (error) {
        await m.reply(`Unable to ${action} the member: ${error.message || String(error)}`)
    }
}

handler.command = ['add', 'kick']
handler.group = true
handler.admin = true
handler.isBotAdmin = true

export default handler
