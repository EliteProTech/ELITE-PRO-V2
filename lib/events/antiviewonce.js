import { smsg } from '../myfunc.js'

const mediaTypes = new Set(['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'])

function isViewOnceMessage(message) {
    let value = message
    while (value && typeof value === 'object') {
        if (value.viewOnceMessage || value.viewOnceMessageV2 || value.viewOnceMessageV2Extension) return true
        if (value.ephemeralMessage?.message) value = value.ephemeralMessage.message
        else if (value.documentWithCaptionMessage?.message) value = value.documentWithCaptionMessage.message
        else return false
    }
    return false
}

let handler = async (EliteProTech, { messages, type }) => {
    const scope = global.antiViewOnceScope
    if (type !== 'notify' || !scope) return

    for (const raw of messages || []) {
        const chat = raw.key?.remoteJidAlt || raw.key?.remoteJid
        if (!raw?.message || raw.key?.fromMe || !chat || chat === 'status@broadcast') continue
        if (!isViewOnceMessage(raw.message)) continue

        const isGroup = chat.endsWith('@g.us')
        if (scope === 'dm' && isGroup) continue
        if (scope === 'group' && !isGroup) continue

        try {
            const m = await smsg(EliteProTech, raw)
            if (!mediaTypes.has(m.mtype)) continue

            const media = await m.download()
            const destination = EliteProTech.decodeJid(EliteProTech.user.id)
            const caption = m.text || ''
            const options = { quoted: m }

            if (m.mtype === 'imageMessage') {
                await EliteProTech.sendMessage(destination, { image: media, mimetype: m.mimetype || 'image/jpeg', caption }, options)
            } else if (m.mtype === 'videoMessage') {
                await EliteProTech.sendMessage(destination, { video: media, mimetype: m.mimetype || 'video/mp4', caption }, options)
            } else if (m.mtype === 'audioMessage') {
                await EliteProTech.sendMessage(destination, { audio: media, mimetype: m.mimetype || 'audio/mpeg', ptt: Boolean(m.msg?.ptt) }, options)
            } else if (m.mtype === 'documentMessage') {
                await EliteProTech.sendMessage(destination, {
                    document: media,
                    mimetype: m.mimetype || 'application/octet-stream',
                    fileName: m.msg?.fileName || 'view-once-file',
                    caption
                }, options)
            } else {
                await EliteProTech.sendMessage(destination, { sticker: media }, options)
            }
        } catch {}
    }
}

handler.on = 'messages.upsert'

export default handler
