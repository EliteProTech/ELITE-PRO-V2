import { Jimp, loadFont, measureText, measureTextHeight } from 'jimp'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_IMAGE_PIXELS = 20_000_000
const printPluginDirectory = dirname(fileURLToPath(import.meta.resolve('@jimp/plugin-print')))
const FONT_64 = resolve(printPluginDirectory, '../fonts/open-sans/open-sans-64-white/open-sans-64-white.fnt')
const FONT_32 = resolve(printPluginDirectory, '../fonts/open-sans/open-sans-32-white/open-sans-32-white.fnt')

let handler = async (m, { EliteProTech, text = '' }) => {
    const target = m.quoted?.mtype === 'imageMessage'
        ? m.quoted
        : m.mtype === 'imageMessage' ? m : null

    if (!target) return await m.reply('Reply to an image (or send an image with the command as its caption).')

    const label = String(text).trim()
    if (!label) return await m.reply(`Add the text to place in the center.\nExample: ${global.prefix || '.'}watermark cyrilix`)
    if (label.length > 80) return await m.reply('Keep the watermark under 80 characters so it fits cleanly.')

    try {
        const media = await target.download()
        if (!media?.length) return await m.reply('Could not download the image.')
        if (media.length > MAX_IMAGE_BYTES) return await m.reply('That image is too large (maximum 10 MB).')

        const image = await Jimp.read(media)
        const { width, height } = image.bitmap
        if (!width || !height || width * height > MAX_IMAGE_PIXELS) {
            return await m.reply('That image is too large to process (maximum 20 megapixels).')
        }

        let font = await loadFont(FONT_64)
        if (measureText(font, label) > width - 24) font = await loadFont(FONT_32)
        if (measureText(font, label) > width - 24) {
            return await m.reply('That text is too wide for this image. Try a shorter watermark.')
        }

        const textWidth = measureText(font, label)
        const textHeight = measureTextHeight(font, label, width)
        image.print({
            font,
            text: label,
            x: Math.max(0, (width - textWidth) / 2),
            y: Math.max(0, (height - textHeight) / 2)
        })

        const mimetype = image.mime === 'image/jpeg' ? 'image/jpeg' : 'image/png'
        const output = await image.getBuffer(mimetype)
        return await EliteProTech.sendMessage(m.chat, {
            image: output,
            mimetype,
            caption: '✅ Watermark added.'
        }, { quoted: m })
    } catch (error) {
        return await m.reply(`Watermark failed: ${error.message || String(error)}`)
    }
}

handler.command = ['watermark', 'imgtext']

export default handler
