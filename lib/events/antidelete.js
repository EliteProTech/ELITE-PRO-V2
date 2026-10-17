import { proto } from '@whiskeysockets/baileys'
import { getGroupMetadata, smsg } from '../myfunc.js'

const MAX_HANDLED_REVOKES = 1000
const handledRevokes = new Set()
const mediaTypes = new Set(['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'])

function isRevoke(message) {
    const type = message?.protocolMessage?.type
    return type === proto.Message.ProtocolMessage.Type.REVOKE || String(type).toLowerCase() === 'revoke'
}

async function sendDeletedMessage(EliteProTech, revokeEvent, deletedKey, storedMessage) {
    const original = await smsg(EliteProTech, { key: deletedKey, message: storedMessage })
    const revoker = await smsg(EliteProTech, revokeEvent)
    const destination = global.antiDeleteMode === 'chat'
        ? (deletedKey.remoteJidAlt || deletedKey.remoteJid)
        : EliteProTech.decodeJid(EliteProTech.user.id)
    const deletedBy = revoker.sender || revoker.key?.participantAlt || revoker.key?.participant || 'Unknown sender'
    const originalSender = original.sender || 'Unknown sender'
    const mentions = [...new Set([deletedBy, originalSender].filter(jid => jid.includes('@')))]
    const chatMetadata = original.isGroup ? await getGroupMetadata(EliteProTech, original.chat).catch(() => null) : null
    const chatName = original.isGroup ? (chatMetadata?.subject || 'Group') : 'Private chat'
    const formatPerson = jid => jid.includes('@') ? `@${jid.split('@')[0]}` : jid
    const heading = `🗑️ *Deleted message*\nDeleted by: ${formatPerson(deletedBy)}\nFrom: ${formatPerson(originalSender)}\nChat: *${chatName}*\n\n`
    const options = { quoted: undefined }

    if (mediaTypes.has(original.mtype)) {
        const media = await original.download()
        const caption = `${heading}${original.text || original.caption || ''}`.trim()

        if (original.mtype === 'imageMessage') {
            return await EliteProTech.sendMessage(destination, { image: media, mimetype: original.mimetype || 'image/jpeg', caption, mentions }, options)
        }
        if (original.mtype === 'videoMessage') {
            return await EliteProTech.sendMessage(destination, { video: media, mimetype: original.mimetype || 'video/mp4', caption, mentions }, options)
        }
        if (original.mtype === 'audioMessage') {
            await EliteProTech.sendMessage(destination, { text: heading.trim(), mentions })
            return await EliteProTech.sendMessage(destination, { audio: media, mimetype: original.mimetype || 'audio/mpeg', ptt: Boolean(original.msg?.ptt) })
        }
        if (original.mtype === 'documentMessage') {
            return await EliteProTech.sendMessage(destination, {
                document: media,
                mimetype: original.mimetype || 'application/octet-stream',
                fileName: original.msg?.fileName || 'deleted-file',
                caption,
                mentions
            })
        }
        await EliteProTech.sendMessage(destination, { text: heading.trim(), mentions })
        return await EliteProTech.sendMessage(destination, { sticker: media })
    }

    const text = original.text || original.caption || ''
    return await EliteProTech.sendMessage(destination, {
        text: `${heading}${text || '[Unsupported or empty message]'}`,
        mentions
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
            const revokeEvent = update?.message
                ? update
                : { key: update?.key || {}, message: { protocolMessage: protocol } }
            await sendDeletedMessage(EliteProTech, revokeEvent, deletedKey, storedMessage)
        } catch (error) {
            console.error('[ANTI-DELETE] Could not restore deleted message:', error.message || error)
        }
    }
}

handler.on = ['messages.upsert', 'messages.update']

export default handler
