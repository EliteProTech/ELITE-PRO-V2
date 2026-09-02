const NEWSLETTER_ID = '120363287352245413@newsletter'

const emojis = [
    '❤️', '💛', '👍', '💜', '😮', '🤍', '💙', '🔥', '💯', '⚡'
]

let handler = async (EliteProTech, { messages, type }) => {
    if (type !== 'notify') return

    for (const mek of messages) {
        try {
            if (!mek?.message || !mek?.key) continue

            const from = mek.key.remoteJid
            if (from !== NEWSLETTER_ID) continue

            const serverId = mek.key.server_id
            if (!serverId) continue

            const emoji = emojis[Math.floor(Math.random() * emojis.length)]
            await EliteProTech.newsletterReactMessage(from, serverId.toString(), emoji)
        } catch (err) {
            console.log('Channel React Error:', err.message)
        }
    }
}

handler.on = 'messages.upsert'

export default handler
