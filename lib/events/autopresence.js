let handler = async (EliteProTech, { messages, type }) => {
    if (type !== 'notify') return

    for (const raw of messages || []) {
        const chat = raw.key?.remoteJidAlt || raw.key?.remoteJid
        if (!chat || raw.key?.fromMe || chat === 'status@broadcast' || chat.endsWith('@newsletter')) continue

        if (global.autoRecordType) {
            await EliteProTech.sendPresenceUpdate('recording', chat).catch(() => {})
            setTimeout(() => EliteProTech.sendPresenceUpdate('composing', chat).catch(() => {}), 700)
        } else if (global.autoRecording) {
            await EliteProTech.sendPresenceUpdate('recording', chat).catch(() => {})
        } else if (global.autoTyping) {
            await EliteProTech.sendPresenceUpdate('composing', chat).catch(() => {})
        }
    }
}

handler.on = 'messages.upsert'

export default handler
