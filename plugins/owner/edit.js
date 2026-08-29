function quotedKey(m) {
    if (!m.quoted?.id) return null
    return {
        remoteJid: m.quoted.chat || m.chat,
        fromMe: m.quoted.fromMe,
        id: m.quoted.id,
        participant: m.quoted.participant || m.quoted.sender || undefined
    }
}

let handler = async (m, { EliteProTech, text }) => {
    const key = quotedKey(m)
    if (!key) return await m.reply(`Reply to one of the bot's messages.\n\nUsage: ${global.prefix || ''}edit <new text>`)
    if (!m.quoted.fromMe) return await m.reply('You can only edit a message sent by this bot.')
    if (!text.trim()) return await m.reply(`Usage: ${global.prefix || ''}edit <new text>`)

    try {
        await EliteProTech.sendMessage(m.chat, { text: text.trim(), edit: key })
    } catch (error) {
        await m.reply(`Unable to edit that message: ${error.message || String(error)}`)
    }
}

handler.command = ['edit']
handler.owner = true

export default handler
