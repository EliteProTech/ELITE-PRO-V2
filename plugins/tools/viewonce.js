import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const SUPPORTED = ['imageMessage', 'videoMessage', 'audioMessage']

function messageContent(target, type) {
    const content = target?.msg || target?.message?.[type]
    if (content && typeof content === 'object') return content
    return null
}

async function downloadTarget(target, type) {
    try {
        const buffer = await target.download()
        if (buffer?.length) return buffer
    } catch {}

    const content = messageContent(target, type)
    if (!content) throw new Error('The replied message has no downloadable media.')

    const mediaType = type.replace(/Message$/, '').toLowerCase()
    const stream = await downloadContentFromMessage(content, mediaType)
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)
    if (!buffer.length) throw new Error('WhatsApp returned an empty media file.')
    return buffer
}

let handler = async (m, { EliteProTech, text = '' }) => {
    // Prefer the replied-to message, otherwise allow media sent with the command.
    const target = SUPPORTED.includes(m.quoted?.mtype)
        ? m.quoted
        : (SUPPORTED.includes(m.mtype) ? m : null)
    if (!target) {
        const prefix = global.prefix || '.'
        if (m.quoted?.text || m.quoted?.caption) {
            return m.reply('WhatsApp only supports view-once for image, video, and audio media—not text messages.')
        }
        return m.reply(`Reply to an image, video, or audio message with ${prefix}once to send it as view once.\nAdd text after the command to set a caption: ${prefix}once your caption`)
    }

    try {
        const type = target.mtype
        const buffer = await downloadTarget(target, type)
        const caption = String(text).trim() || target.text || target.caption || target.msg?.caption || ''
        const options = { quoted: m }

        if (type === 'imageMessage') {
            return await EliteProTech.sendMessage(m.chat, {
                image: buffer,
                mimetype: target.mimetype || target.msg?.mimetype || 'image/jpeg',
                caption,
                viewOnce: true
            }, options)
        }

        if (type === 'videoMessage') {
            return await EliteProTech.sendMessage(m.chat, {
                video: buffer,
                mimetype: target.mimetype || target.msg?.mimetype || 'video/mp4',
                caption,
                gifPlayback: target.msg?.gifPlayback === true,
                viewOnce: true
            }, options)
        }

        const isVoiceNote = target.msg?.ptt === true
        return await EliteProTech.sendMessage(m.chat, {
            audio: buffer,
            mimetype: target.mimetype || target.msg?.mimetype || (isVoiceNote ? 'audio/ogg; codecs=opus' : 'audio/mpeg'),
            ptt: isVoiceNote,
            viewOnce: true
        }, options)
    } catch (error) {
        await m.reply(`Could not send the replied media as view once: ${error.message || String(error)}`)
    }
}

handler.command = ['once', 'vo', 'sendonce']

export default handler
