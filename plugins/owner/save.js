const MEDIA_TYPES = new Set([
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'documentMessage',
    'stickerMessage'
])

async function sendMedia(EliteProTech, quoted, destination, quotedMessage) {
    const media = await quoted.download()
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

    const isViewOnceCommand = command === 'vv' || command === 'viewonce'
    if (isViewOnceCommand && !MEDIA_TYPES.has(m.quoted.mtype)) {
        return await m.reply('Reply to a view-once image, video, audio, document, or sticker.')
    }

    try {
        await EliteProTech.sendMessage(m.chat, { react: { text: command === 'save' ? '💾' : '⏳', key: m.key } })

        if (MEDIA_TYPES.has(m.quoted.mtype)) {
            await sendMedia(EliteProTech, m.quoted, command === 'save' ? m.sender : m.chat, m)
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

handler.command = ['save', 'vv', 'viewonce']
handler.owner = true

export default handler
