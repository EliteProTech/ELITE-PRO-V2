const confirmations = new Map()

const confirmationKey = (chat, sender) => `${chat}:${sender}`

let handler = async (m, { text, command, EliteProTech }) => {
    const key = confirmationKey(m.chat, m.sender)

    if (!command && /^confirm$/i.test(m.text.trim())) {
        const pending = confirmations.get(key)
        if (!pending || pending.expiresAt <= Date.now() || m.quoted?.id !== pending.messageId) return

        confirmations.delete(key)
        try {
            await m.reply('Logging out...')
            await EliteProTech.logout()
        } catch (error) {
            await m.reply(`Logout failed: ${error.message || String(error)}`)
        }
        return
    }

    if (text?.trim()) return await m.reply(`Reply to the confirmation message with *confirm*.\nUsage: ${global.prefix || ''}logout`)

    const sent = await EliteProTech.sendMessage(m.chat, {
        text: '⚠️ This will log the bot out of WhatsApp.\n\nReply to this message with *confirm* to continue.'
    }, { quoted: m })

    confirmations.set(key, { messageId: sent.key.id, expiresAt: Date.now() + 60_000 })
    setTimeout(() => {
        const pending = confirmations.get(key)
        if (pending?.messageId === sent.key.id) confirmations.delete(key)
    }, 60_000)
}

handler.command = ['logout']
handler.owner = true
handler.silentDeny = true
handler.customPrefix = /^confirm$/i

export default handler
