const confirmationKey = (chat, sender) => `${chat}:${sender}`

let handler = async (m, { text, EliteProTech }) => {
    const key = confirmationKey(m.chat, m.sender)

    if (text?.trim()) return await m.reply(`Reply to the confirmation message with *confirm*.\nUsage: ${global.prefix || ''}logout`)

    const sent = await EliteProTech.sendMessage(m.chat, {
        text: '⚠️ This will log the bot out of WhatsApp.\n\nReply to this message with *confirm* to continue.'
    }, { quoted: m })

    global.logoutConfirmations ??= new Map()
    global.logoutConfirmations.set(key, { messageId: sent.key.id, expiresAt: Date.now() + 60_000 })
    setTimeout(() => {
        const pending = global.logoutConfirmations?.get(key)
        if (pending?.messageId === sent.key.id) global.logoutConfirmations.delete(key)
    }, 60_000)
}

handler.command = ['logout']
handler.owner = true
handler.silentDeny = true

export default handler
