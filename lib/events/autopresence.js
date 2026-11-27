let handler = (EliteProTech, { messages, type }) => {
    if (type !== 'notify') return

    const sentChats = new Set()
    for (const raw of messages || []) {
        const primaryChat = raw.key?.remoteJid
        const alternateChat = raw.key?.remoteJidAlt
        if (!primaryChat || primaryChat === 'status@broadcast' || primaryChat.endsWith('@newsletter')) continue
        if (alternateChat?.endsWith('@newsletter') || raw.key?.fromMe || !raw.message || raw.message.protocolMessage || raw.messageStubType) continue
        const chat = alternateChat || primaryChat
        if (sentChats.has(chat)) continue
        sentChats.add(chat)

        if (global.autoRecordType) {
            void EliteProTech.sendPresenceUpdate('recording', chat).catch(() => {})
            setTimeout(() => void EliteProTech.sendPresenceUpdate('composing', chat).catch(() => {}), 700)
        } else if (global.autoRecording) {
            void EliteProTech.sendPresenceUpdate('recording', chat).catch(() => {})
        } else if (global.autoTyping) {
            void EliteProTech.sendPresenceUpdate('composing', chat).catch(() => {})
        }
    }
}

handler.on = 'messages.upsert'

export default handler
