import { Jimp } from 'jimp'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_IMAGE_PIXELS = 20_000_000

const usage = command => command === 'flip'
    ? `Usage: ${global.prefix || ''}flip [h|v]\nExample: ${global.prefix || ''}flip v`
    : `Usage: ${global.prefix || ''}rotate [90|-90|180|270]`

let handler = async (m, { EliteProTech, args, command }) => {
    if (!m.quoted || m.quoted.mtype !== 'imageMessage' || !String(m.quoted.mimetype || '').startsWith('image/')) {
        return await m.reply('Reply to an image first.')
    }

    const mode = String(args[0] || (command === 'flip' ? 'h' : '90')).toLowerCase()
    if (command === 'flip' && !['h', 'horizontal', 'v', 'vertical'].includes(mode)) {
        return await m.reply(usage(command))
    }

    const angle = Number(mode)
    if (command === 'rotate' && ![-270, -180, -90, 90, 180, 270].includes(angle)) {
        return await m.reply(usage(command))
    }

    try {
        const media = await m.quoted.download()
        if (!media?.length) return await m.reply('Failed to download the image.')
        if (media.length > MAX_IMAGE_BYTES) {
            return await m.reply('That image is too large to process. Maximum size is 10 MB.')
        }

        const image = await Jimp.read(media)
        const { width, height } = image.bitmap
        if (!width || !height || width * height > MAX_IMAGE_PIXELS) {
            return await m.reply('That image is too large to process. Maximum dimensions are 20 megapixels.')
        }

        if (command === 'flip') {
            const vertical = mode === 'v' || mode === 'vertical'
            image.flip({ horizontal: !vertical, vertical })
        } else {
            image.rotate(angle)
        }

        const mimetype = image.mime === 'image/jpeg' ? 'image/jpeg' : 'image/png'
        const buffer = await image.getBuffer(mimetype)
        return await EliteProTech.sendMessage(m.chat, {
            image: buffer,
            mimetype,
            caption: command === 'flip' ? '↔️ Image flipped.' : '🔄 Image rotated.'
        }, { quoted: m })
    } catch (error) {
        return await m.reply(`Image processing failed: ${error.message || String(error)}`)
    }
}

handler.command = ['flip', 'rotate']

export default handler
