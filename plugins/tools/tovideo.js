import { toVideo } from '../../lib/converter.js'

function extFromMime(mime = '') {
    if (mime.includes('webp')) return 'webp'
    if (mime.includes('gif')) return 'gif'
    if (mime.includes('webm')) return 'webm'
    if (mime.includes('mp4')) return 'mp4'
    if (mime.includes('avi')) return 'avi'
    if (mime.includes('mkv')) return 'mkv'
    return 'bin'
}

let handler = async (m, { EliteProTech }) => {
    const target = ['videoMessage', 'stickerMessage', 'imageMessage'].includes(m.quoted?.mtype)
        ? m.quoted
        : (['videoMessage', 'stickerMessage', 'imageMessage'].includes(m.mtype) ? m : null)

    if (!target) {
        return await m.reply('Reply to (or send with caption) a video, sticker, or GIF-like image to convert it to MP4.')
    }

    await m.reply('Converting to video...')

    try {
        const buffer = await target.download()
        const ext = extFromMime(target.mimetype)
        const mp4Buffer = await toVideo(buffer, ext)

        await EliteProTech.sendMessage(m.chat, {
            video: mp4Buffer,
            mimetype: 'video/mp4',
            fileName: `converted-${Date.now()}.mp4`
        }, { quoted: m })
    } catch (e) {
        await m.reply(`Conversion failed: ${e.message}`)
    }
}

handler.command = ['tovideo', 'tomp4']

export default handler
