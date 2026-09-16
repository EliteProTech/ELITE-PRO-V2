const MEDIA_TYPES = new Set([
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'documentMessage',
    'stickerMessage'
])

async function resendQuoted(EliteProTech, quoted, destination, quotedMessage) {
    const caption = quoted.text || quoted.caption || ''

    if (!MEDIA_TYPES.has(quoted.mtype)) {
        if (!caption) throw new Error(`Unsupported message type: ${quoted.mtype || 'unknown'}`)
        return EliteProTech.sendMessage(destination, { text: caption }, { quoted: quotedMessage })
    }

    const media = await quoted.download()

    if (quoted.mtype === 'imageMessage') {
        return EliteProTech.sendMessage(destination, {
            image: media,
            mimetype: quoted.mimetype || 'image/jpeg',
            caption
        }, { quoted: quotedMessage })
    }

    if (quoted.mtype === 'videoMessage') {
        return EliteProTech.sendMessage(destination, {
            video: media,
            mimetype: quoted.mimetype || 'video/mp4',
            caption
        }, { quoted: quotedMessage })
    }

    if (quoted.mtype === 'audioMessage') {
        return EliteProTech.sendMessage(destination, {
            audio: media,
            mimetype: quoted.mimetype || 'audio/mpeg',
            ptt: Boolean(quoted.msg?.ptt)
        }, { quoted: quotedMessage })
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

let handler = async (m, { EliteProTech }) => {
    if (!m.quoted) {
        return await m.reply('Reply to a message to send a fresh copy of it.')
    }

    try {
        await resendQuoted(EliteProTech, m.quoted, m.chat, m)
    } catch (error) {
        await m.reply(`Unable to process that message: ${error.message || String(error)}`)
    }
}

handler.command = ['quoted', 'resend']
handler.owner = true

export default handler
