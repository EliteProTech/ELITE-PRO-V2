const processedStatusMessages = new Set()

const emojis = [
    '❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗',
    '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎',
    '✅', '⚡', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟',
    '🗿', '☠️', '💜', '💙', '🌝', '💚'
]

let handler = async (EliteProTech, { messages, type }) => {
    if (type !== 'notify' || (!global.autoViewStatus && !global.autoLikeStatus)) return

    for (const raw of messages) {
        if (raw.key?.remoteJid !== 'status@broadcast' || raw.key?.fromMe) continue
        if (!raw.message) continue

        const msgId = raw.key.id
        if (processedStatusMessages.has(msgId)) continue
        processedStatusMessages.add(msgId)
        setTimeout(() => processedStatusMessages.delete(msgId), 5 * 60 * 1000)

        const participantJid = raw.key.participantAlt || raw.key.participant
        if (!participantJid) continue

        const statusKey = {
            remoteJid: 'status@broadcast',
            id: msgId,
            fromMe: false,
            participant: participantJid
        }

        if (global.autoViewStatus) {
            try {
                await EliteProTech.readMessages([statusKey])
            } catch (e) {}
        }

        if (global.autoLikeStatus) {
            try {
                const emoji = emojis[Math.floor(Math.random() * emojis.length)]
                await EliteProTech.sendMessage('status@broadcast', {
                    react: { text: emoji, key: statusKey }
                }, { statusJidList: [participantJid] })
            } catch (e) {}
        }
    }
}

handler.on = 'messages.upsert'

export default handler
