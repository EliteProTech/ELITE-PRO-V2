let handler = async (EliteProTech, { messages, type }) => {
    if (type !== 'notify' || !global.autoViewStatus) return

    for (const raw of messages) {
        if (raw.key?.remoteJid !== 'status@broadcast') continue
        try {
            await EliteProTech.readMessages([raw.key])
        } catch (e) {}
    }
}

handler.on = 'messages.upsert'

export default handler
