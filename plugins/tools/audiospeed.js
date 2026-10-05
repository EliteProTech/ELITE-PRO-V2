import { changeAudioSpeed } from '../../lib/converter.js'

function extFromMime(mime = '') {
    if (mime.includes('ogg')) return 'ogg'
    if (mime.includes('mpeg')) return 'mp3'
    if (mime.includes('wav')) return 'wav'
    if (mime.includes('webm')) return 'webm'
    if (mime.includes('m4a') || mime.includes('mp4a')) return 'm4a'
    return 'bin'
}

let handler = async (m, { EliteProTech, args }) => {
    const target = m.quoted?.mtype === 'audioMessage'
        ? m.quoted
        : (m.mtype === 'audioMessage' ? m : null)
    const speed = Number(args[0])

    if (!target || !Number.isFinite(speed) || speed < 0.5 || speed > 2) {
        return await m.reply(`Reply to an audio message.\n\nUsage: ${global.prefix || ''}audiospeed 0.5–2\nExample: ${global.prefix || ''}audiospeed 1.25`)
    }

    try {
        await m.reply(`Changing audio speed to ${speed}x…`)
        const audio = await target.download()
        const converted = await changeAudioSpeed(audio, extFromMime(target.mimetype), speed)
        await EliteProTech.sendMessage(m.chat, {
            audio: converted,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: Boolean(target.msg?.ptt)
        }, { quoted: m })
    } catch (error) {
        await m.reply(`Audio speed change failed: ${error.message || String(error)}`)
    }
}

handler.command = ['audiospeed', 'speedaudio']

export default handler
