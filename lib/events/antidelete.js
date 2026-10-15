import { proto } from '@whiskeysockets/baileys'
import { smsg } from '../myfunc.js'

const MAX_HANDLED_REVOKES = 1000
const handledRevokes = new Set()
const mediaTypes = new Set(['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'])

function isRevoke(message) {
    const type = message?.protocolMessage?.type
    return type === proto.Message.ProtocolMessage.Type.REVOKE || String(type).toLowerCase() === 'revoke'
}

async function sendDeletedMessage(EliteProTech, deletedKey, storedMessage) {
    const original = await smsg(EliteProTech, { key: deletedKey, message: storedMessage })
    const destination = global.antiDeleteMode === 'chat'
        ? (deletedKey.remoteJidAlt || deletedKey.remoteJid)
        : EliteProTech.decodeJid(EliteProTech.user.id)
    const who = original.sender ? `@${original.sender.split('@')[0]}` : 'Unknown sender'
    const heading = `🗑️ *Deleted message*\nFrom: ${who}\nChat: ${original.isGroup ? (original.groupMetadata?.subject || original.chat) : 'Private chat'}\n\n`
    const options = { quoted: undefined }

    if (mediaTypes.has(original.mtype)) {
        const media = await original.download()
        const caption = `${heading}${original.text || original.caption || ''}`.trim()

        if (original.mtype === 'imageMessage') {
            return await EliteProTech.sendMessage(destination, { image: media, mimetype: original.mimetype || 'image/jpeg', caption, mentions: original.sender ? [original.sender] : [] }, options)
        }
        if (original.mtype === 'videoMessage') {
            return await EliteProTech.sendMessage(destination, { video: media, mimetype: original.mimetype || 'video/mp4', caption, mentions: original.sender ? [original.sender] : [] }, options)
        }
        if (original.mtype === 'audioMessage') {
            await EliteProTech.sendMessage(destination, { text: heading.trim(), mentions: original.sender ? [original.sender] : [] })
            return await EliteProTech.sendMessage(destination, { audio: media, mimetype: original.mimetype || 'audio/mpeg', ptt: Boolean(original.msg?.ptt) })
        }
        if (original.mtype === 'documentMessage') {
            return await EliteProTech.sendMessage(destination, {
                document: media,
                mimetype: original.mimetype || 'application/octet-stream',
                fileName: original.msg?.fileName || 'deleted-file',
                caption,
                mentions: original.sender ? [original.sender] : []
            })
        }
        await EliteProTech.sendMessage(destination, { text: heading.trim(), mentions: original.sender ? [original.sender] : [] })
        return await EliteProTech.sendMessage(destination, { sticker: media })
    }

    const text = original.text || original.caption || ''
    return await EliteProTech.sendMessage(destination, {
        text: `${heading}${text || '[Unsupported or empty message]'}`,
        mentions: original.sender ? [original.sender] : []
    })
}

let handler = async (EliteProTech, data) => {
    if (!global.antiDelete) return
    if (Array.isArray(data?.messages) && data.type !== 'notify') return
    const updates = Array.isArray(data?.messages)
        ? data.messages
        : Array.isArray(data) ? data : [data]

    for (const update of updates) {
        const protocol = update?.update?.message?.protocolMessage || update?.message?.protocolMessage
        if (!isRevoke({ protocolMessage: protocol })) continue

        const deletedKey = protocol?.key
        if (!deletedKey?.id || !deletedKey?.remoteJid) continue
        const revokeId = update?.key?.id || `${deletedKey.remoteJid}:${deletedKey.id}`
        if (handledRevokes.has(revokeId)) continue
        handledRevokes.add(revokeId)
        while (handledRevokes.size > MAX_HANDLED_REVOKES) {
            handledRevokes.delete(handledRevokes.values().next().value)
        }

        const storedMessage = EliteProTech.getStoredMessage?.(deletedKey)
        if (!storedMessage) continue

        try {
            await sendDeletedMessage(EliteProTech, deletedKey, storedMessage)
        } catch (error) {
            console.error('[ANTI-DELETE] Could not restore deleted message:', error.message || error)
        }
    }
}

handler.on = ['messages.upsert', 'messages.update']

export default handler
