import { toPTT } from '../../lib/converter.js'

function extFromMime(mime = '') {
    if (mime.includes('mp4')) return 'mp4'
    if (mime.includes('webm')) return 'webm'
    if (mime.includes('ogg')) return 'ogg'
    if (mime.includes('mpeg')) return 'mp3'
    if (mime.includes('wav')) return 'wav'
    if (mime.includes('m4a') || mime.includes('mp4a')) return 'm4a'
    return 'bin'
}

let handler = async (m, { EliteProTech }) => {
    const target = m.quoted?.mtype === 'audioMessage' || m.quoted?.mtype === 'videoMessage'
        ? m.quoted
        : (m.mtype === 'audioMessage' || m.mtype === 'videoMessage' ? m : null)

    if (!target) {
        return await m.reply('Reply to (or send with caption) an audio or video to convert it to a voice note.')
    }

    await m.reply('Converting to voice note...')

    try {
        const buffer = await target.download()
        const ext = extFromMime(target.mimetype)
        const oggBuffer = await toPTT(buffer, ext)

        await EliteProTech.sendMessage(m.chat, {
            audio: oggBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: m })
    } catch (e) {
        await m.reply(`Conversion failed: ${e.message}`)
    }
}

handler.command = ['toptt', 'tovn', 'tovoice']

export default handler
