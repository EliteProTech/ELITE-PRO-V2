import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const MEDIA_TYPES = new Set([
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'documentMessage',
    'stickerMessage'
])

function hasDownloadData(content) {
    return Boolean(content && (content.url || content.directPath))
}

function findCachedMedia(message, type) {
    let content = message
    const wrappers = [
        'ephemeralMessage',
        'viewOnceMessage',
        'viewOnceMessageV2',
        'viewOnceMessageV2Extension',
        'documentWithCaptionMessage',
        'editedMessage',
        'deviceSentMessage'
    ]

    for (let depth = 0; content && depth < 10; depth++) {
        if (content[type] && hasDownloadData(content[type])) return content[type]
        const wrapper = wrappers.find(key => content[key]?.message)
        if (!wrapper) break
        content = content[wrapper].message
    }

    return null
}

async function downloadMedia(EliteProTech, quoted) {
    try {
        const media = await quoted.download()
        if (media?.length) return media
    } catch {}

    const cachedMessage = EliteProTech.getStoredMessage?.(quoted.fakeObj?.key || {
        remoteJid: quoted.chat,
        participant: quoted.participant || quoted.sender,
        id: quoted.id
    })
    const cachedMedia = findCachedMedia(cachedMessage, quoted.mtype)
    if (cachedMedia) {
        const mediaType = quoted.mtype.replace(/Message$/, '').toLowerCase()
        const stream = await downloadContentFromMessage(cachedMedia, mediaType)
        const chunks = []
        for await (const chunk of stream) chunks.push(chunk)
        const media = Buffer.concat(chunks)
        if (media.length) return media
    }

    throw new Error('The quoted copy has no media download data, and the original is not available in the bot’s message cache. The bot must have received the original while online to recover it.')
}

async function sendMedia(EliteProTech, quoted, destination, quotedMessage) {
    const media = await downloadMedia(EliteProTech, quoted)
    const caption = quoted.text || quoted.caption || ''

    if (quoted.mtype === 'imageMessage') {
        return EliteProTech.sendMessage(destination, { image: media, mimetype: quoted.mimetype || 'image/jpeg', caption }, { quoted: quotedMessage })
    }
    if (quoted.mtype === 'videoMessage') {
        return EliteProTech.sendMessage(destination, { video: media, mimetype: quoted.mimetype || 'video/mp4', caption }, { quoted: quotedMessage })
    }
    if (quoted.mtype === 'audioMessage') {
        return EliteProTech.sendMessage(destination, { audio: media, mimetype: quoted.mimetype || 'audio/mpeg', ptt: Boolean(quoted.msg?.ptt) }, { quoted: quotedMessage })
    }
    if (quoted.mtype === 'documentMessage') {
        return EliteProTech.sendMessage(destination, {
            document: media,
            mimetype: quoted.mimetype || 'application/octet-stream',
            fileName: quoted.msg?.fileName || 'document',
            caption
        }, { quoted: quotedMessage })
    }
    return EliteProTech.sendMessage(destination, { sticker: media }, { quoted: quotedMessage })
}

let handler = async (m, { command, EliteProTech }) => {
    if (!m.quoted) {
        return await m.reply(command === 'save'
            ? 'Reply to a WhatsApp status to save it.'
            : 'Reply to a view-once image, video, audio, document, or sticker.')
    }

    const isViewOnceCommand = command === 'vv' || command === 'vvdm' || command === 'viewonce'
    const isViewOnce = Boolean(m.quoted.viewOnce || m.quoted.msg?.viewOnce)
    if (isViewOnceCommand && (!MEDIA_TYPES.has(m.quoted.mtype) || !isViewOnce)) {
        return await m.reply('Reply to a view-once image, video, audio, document, or sticker.')
    }

    try {
        await EliteProTech.sendMessage(m.chat, { react: { text: command === 'save' ? '💾' : '⏳', key: m.key } })

        if (MEDIA_TYPES.has(m.quoted.mtype)) {
            await sendMedia(EliteProTech, m.quoted, command === 'save' || command === 'vvdm' ? m.sender : m.chat, m)
        } else if (command === 'save' && m.quoted.text) {
            await EliteProTech.sendMessage(m.sender, { text: m.quoted.text }, { quoted: m })
        } else {
            return await m.reply(`Unsupported message type: ${m.quoted.mtype || 'unknown'}`)
        }

        await EliteProTech.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    } catch (error) {
        await EliteProTech.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {})
        await m.reply(`Unable to process that message: ${error.message || String(error)}`)
    }
}

handler.command = ['save', 'vv', 'vvdm', 'viewonce']
handler.owner = true

export default handler
