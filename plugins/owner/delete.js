function quotedKey(m) {
    if (!m.quoted?.id) return null
    return {
        remoteJid: m.quoted.chat || m.chat,
        fromMe: m.quoted.fromMe,
        id: m.quoted.id,
        participant: m.quoted.participant || m.quoted.sender || undefined
    }
}

let handler = async (m, { EliteProTech }) => {
    const key = quotedKey(m)
    if (!key) return await m.reply(`Reply to a message first.\n\nUsage: ${global.prefix || ''}delete`)

    const canModerateGroup = m.isGroup && m.isAdmin && m.isBotAdmin
    const canDeleteBotMessage = m.isOwner && m.quoted.fromMe
    if (!canModerateGroup && !canDeleteBotMessage) {
        return await m.reply('Only a group admin, with the bot as an admin, can delete members’ messages. Outside a group, only the owner can delete bot messages.')
    }

    try {
        await EliteProTech.sendMessage(m.chat, { delete: key })
    } catch (error) {
        await m.reply(`Unable to delete that message: ${error.message || String(error)}`)
    }
}

handler.command = ['delete', 'del']

export default handler
