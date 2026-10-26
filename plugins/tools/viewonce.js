import { toPTT } from '../../lib/converter.js'

const SUPPORTED = ['imageMessage', 'videoMessage', 'audioMessage']

function audioExt(mime = '') {
    if (mime.includes('ogg') || mime.includes('opus')) return 'ogg'
    if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3'
    if (mime.includes('wav')) return 'wav'
    if (mime.includes('aac')) return 'aac'
    return 'm4a'
}

let handler = async (m, { EliteProTech, text = '' }) => {
    const target = SUPPORTED.includes(m.quoted?.mtype) ? m.quoted : (SUPPORTED.includes(m.mtype) ? m : null)
    if (!target) {
        const prefix = global.prefix || '.'
        return m.reply(`Reply to an image, video or voice note with ${prefix}once to send it as view once.\nAdd text after the command to set a caption: ${prefix}once your caption`)
    }

    try {
        const buffer = await target.download()
        const caption = String(text).trim() || target.msg?.caption || ''
        const options = { quoted: m }

        if (target.mtype === 'imageMessage') {
            return await EliteProTech.sendMessage(m.chat, { image: buffer, caption, viewOnce: true }, options)
        }

        if (target.mtype === 'videoMessage') {
            return await EliteProTech.sendMessage(m.chat, { video: buffer, caption, viewOnce: true }, options)
        }

        const mime = target.mimetype || ''
        const isVoiceNote = target.msg?.ptt === true && /ogg|opus/.test(mime)
        const audio = isVoiceNote ? buffer : await toPTT(buffer, audioExt(mime))
        return await EliteProTech.sendMessage(m.chat, { audio, mimetype: 'audio/ogg; codecs=opus', ptt: true, viewOnce: true }, options)
    } catch (error) {
        await m.reply(`Could not send as view once: ${error.message}`)
    }
}

handler.command = ['once', 'vo', 'sendonce']

export default handler
