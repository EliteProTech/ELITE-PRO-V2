import { toWebp, addStickerExif } from '../../lib/converter.js'

function extFromMime(mime = '') {
    if (mime.includes('webp')) return 'webp'
    if (mime.includes('png')) return 'png'
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
    if (mime.includes('gif')) return 'gif'
    if (mime.includes('mp4')) return 'mp4'
    if (mime.includes('webm')) return 'webm'
    return 'bin'
}

const IMAGE_TYPES = ['imageMessage', 'stickerMessage']
const VIDEO_TYPES = ['videoMessage']

let handler = async (m, { EliteProTech, text }) => {
    const target = [...IMAGE_TYPES, ...VIDEO_TYPES].includes(m.quoted?.mtype)
        ? m.quoted
        : ([...IMAGE_TYPES, ...VIDEO_TYPES].includes(m.mtype) ? m : null)

    if (!target) {
        return await m.reply('Reply to (or send with caption) an image or short video/GIF to convert it into a sticker.\nOptionally add "Packname|Author" after the command.')
    }

    const isVideo = VIDEO_TYPES.includes(target.mtype)

    if (isVideo && target.msg?.seconds && target.msg.seconds > 10) {
        return await m.reply('Video is too long for a sticker — please use a clip under 10 seconds.')
    }

    let packname = global.stickerPack?.packname || global.botName || ''
    let author = global.stickerPack?.author || global.ownerName || ''
    if (text?.trim()) {
        const [customPack, customAuthor] = text.split('|').map(s => s.trim())
        if (customPack) packname = customPack
        if (customAuthor) author = customAuthor
    }

    await m.reply('Creating sticker...')

    try {
        const buffer = await target.download()
        const ext = extFromMime(target.mimetype)
        const webpBuffer = await toWebp(buffer, ext, { isVideo })
        const finalSticker = addStickerExif(webpBuffer, { packname, author })

        await EliteProTech.sendMessage(m.chat, {
            sticker: finalSticker
        }, { quoted: m })
    } catch (e) {
        await m.reply(`Sticker creation failed: ${e.message}`)
    }
}

handler.command = ['sticker', 's', 'stiker']

export default handler
