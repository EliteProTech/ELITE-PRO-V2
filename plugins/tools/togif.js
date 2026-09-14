import { toVideo } from '../../lib/converter.js'

function extFromMime(mime = '') {
    if (mime.includes('webp')) return 'webp'
    if (mime.includes('gif')) return 'gif'
    if (mime.includes('webm')) return 'webm'
    if (mime.includes('mp4')) return 'mp4'
    if (mime.includes('avi')) return 'avi'
    if (mime.includes('mkv')) return 'mkv'
    if (mime.includes('png')) return 'png'
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
    return 'bin'
}

let handler = async (m, { EliteProTech }) => {
    const types = ['videoMessage', 'stickerMessage', 'imageMessage']
    const target = types.includes(m.quoted?.mtype) ? m.quoted : (types.includes(m.mtype) ? m : null)

    if (!target) return await m.reply('Reply to (or send with caption) a video, image, or sticker to convert it to a GIF.')

    await m.reply('Converting to GIF...')
    try {
        const video = await toVideo(await target.download(), extFromMime(target.mimetype))
        await EliteProTech.sendMessage(m.chat, {
            video,
            mimetype: 'video/mp4',
            gifPlayback: true
        }, { quoted: m })
    } catch (error) {
        await m.reply(`Conversion failed: ${error.message}`)
    }
}

handler.command = ['togif']

export default handler
