import { addStickerExif } from '../../lib/converter.js'

let handler = async (m, { EliteProTech, text }) => {
    const sticker = m.quoted?.mtype === 'stickerMessage'
        ? m.quoted
        : (m.mtype === 'stickerMessage' ? m : null)

    if (!sticker) {
        return await m.reply(`Reply to a sticker.\n\nUsage: ${global.prefix || ''}take Packname|Author`)
    }

    let packname = global.stickerPack?.packname || global.botName || ''
    let author = global.stickerPack?.author || global.ownerName || ''
    if (text?.trim()) {
        const [customPack, customAuthor] = text.split('|').map(value => value.trim())
        if (customPack) packname = customPack
        if (customAuthor) author = customAuthor
    }

    try {
        const buffer = await sticker.download()
        const takenSticker = await addStickerExif(buffer, { packname, author })
        await EliteProTech.sendMessage(m.chat, { sticker: takenSticker }, { quoted: m })
    } catch (error) {
        await m.reply(`Unable to take that sticker: ${error.message || String(error)}`)
    }
}

handler.command = ['take', 'steal', 'swm']

export default handler
