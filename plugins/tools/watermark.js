import { Jimp, loadFont, measureText, measureTextHeight } from 'jimp'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_IMAGE_PIXELS = 20_000_000
const printPluginDirectory = dirname(fileURLToPath(import.meta.resolve('@jimp/plugin-print')))
const FONT_64 = resolve(printPluginDirectory, '../fonts/open-sans/open-sans-64-white/open-sans-64-white.fnt')
const TEXT_MARGIN = 24

function wrapText(font, text, maxWidth) {
    const lines = []

    for (const paragraph of text.split(/\r?\n/)) {
        const words = paragraph.trim().split(/\s+/).filter(Boolean)
        let line = ''

        for (const word of words) {
            const candidate = line ? `${line} ${word}` : word
            if (measureText(font, candidate) <= maxWidth) {
                line = candidate
                continue
            }

            if (line) lines.push(line)
            line = ''

            // Break an unusually long word at character boundaries so it can
            // still wrap without changing the configured font size.
            for (const character of word) {
                if (measureText(font, character) > maxWidth) return null
                if (measureText(font, line + character) > maxWidth) {
                    if (line) lines.push(line)
                    line = character
                } else {
                    line += character
                }
            }
        }

        if (line) lines.push(line)
        else if (!words.length) lines.push('')
    }

    return lines
}

let handler = async (m, { EliteProTech, text = '' }) => {
    const target = m.quoted?.mtype === 'imageMessage'
        ? m.quoted
        : m.mtype === 'imageMessage' ? m : null

    if (!target) return await m.reply('Reply to an image (or send an image with the command as its caption).')

    const label = String(text).trim()
    if (!label) return await m.reply(`Add the text to place in the center.\nExample: ${global.prefix || '.'}watermark cyrilix`)
    if (label.length > 240) return await m.reply('Keep the watermark under 240 characters.')

    try {
        const media = await target.download()
        if (!media?.length) return await m.reply('Could not download the image.')
        if (media.length > MAX_IMAGE_BYTES) return await m.reply('That image is too large (maximum 10 MB).')

        const image = await Jimp.read(media)
        const { width, height } = image.bitmap
        if (!width || !height || width * height > MAX_IMAGE_PIXELS) {
            return await m.reply('That image is too large to process (maximum 20 megapixels).')
        }

        const font = await loadFont(FONT_64)
        const maxWidth = width - TEXT_MARGIN * 2
        if (maxWidth <= 0) return await m.reply('This image is too narrow for the fixed-size watermark text.')

        const lines = wrapText(font, label, maxWidth)
        if (!lines) {
            return await m.reply('This image is too narrow for the fixed-size watermark text.')
        }

        const lineHeight = font.common?.lineHeight || measureTextHeight(font, 'Ag', width)
        const textHeight = lineHeight * lines.length
        if (textHeight > height - TEXT_MARGIN * 2) {
            return await m.reply('The wrapped text is too tall for this image. Try a shorter watermark or a taller image.')
        }

        const startY = Math.max(0, (height - textHeight) / 2)
        lines.forEach((line, index) => {
            image.print({
                font,
                text: line,
                x: Math.max(0, (width - measureText(font, line)) / 2),
                y: startY + index * lineHeight
            })
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
