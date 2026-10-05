let lastReactionAt = 0
const REACTION_COOLDOWN_MS = 3000

let handler = async (EliteProTech, { messages, type }) => {
    if (type !== 'notify' || !global.autoReact) return

    for (const message of messages || []) {
        if (!message?.message || message.key?.fromMe || message.key?.remoteJid === 'status@broadcast') continue
        if (Date.now() - lastReactionAt < REACTION_COOLDOWN_MS) continue

        const emojis = global.autoReactEmojis?.filter(Boolean) || ['💚']
        const emoji = emojis[Math.floor(Math.random() * emojis.length)]
        lastReactionAt = Date.now()
        await EliteProTech.sendMessage(message.key.remoteJid, {
            react: { text: emoji, key: message.key }
        }).catch(() => {})
    }
}

handler.on = 'messages.upsert'

export default handler
