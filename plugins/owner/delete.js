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
    if (!key) return await m.reply(`Reply to one of the bot's messages.\n\nUsage: ${global.prefix || ''}delete`)
    if (!m.quoted.fromMe) return await m.reply('You can only delete a message sent by this bot.')

    try {
        await EliteProTech.sendMessage(m.chat, { delete: key })
    } catch (error) {
        await m.reply(`Unable to delete that message: ${error.message || String(error)}`)
    }
}

handler.command = ['delete', 'del']
handler.owner = true

export default handler
