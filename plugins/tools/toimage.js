import { toImage } from '../../lib/converter.js'

let handler = async (m, { EliteProTech }) => {
    const target = m.quoted?.mtype === 'stickerMessage'
        ? m.quoted
        : (m.mtype === 'stickerMessage' ? m : null)

    if (!target) return await m.reply('Reply to (or send with caption) a sticker to convert it to an image.')
    if (target.msg?.isAnimated) return await m.reply('Animated stickers cannot be converted to one image. Use tovideo or togif instead.')

    await m.reply('Converting to image...')
    try {
        const image = await toImage(await target.download())
        await EliteProTech.sendMessage(m.chat, { image, mimetype: 'image/png' }, { quoted: m })
    } catch (error) {
        await m.reply(`Conversion failed: ${error.message}`)
    }
}

handler.command = ['toimage', 'toimg']

export default handler
