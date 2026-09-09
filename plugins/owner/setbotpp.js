import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const eliteProPicPath = fileURLToPath(new URL('../../lib/database/elitepropic.jpg', import.meta.url))

let handler = async (m, { EliteProTech }) => {
    if (!m.quoted) return await m.reply('Reply to the image you want to use for the bot menu.')

    const mime = m.quoted.mimetype || m.quoted.msg?.mimetype || ''
    if (m.quoted.mtype !== 'imageMessage' && !mime.startsWith('image/')) {
        return await m.reply('Reply to an image.')
    }

    try {
        await EliteProTech.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } })
        const media = await m.quoted.download()
        const image = await sharp(media)
            .rotate()
            .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 90 })
            .toBuffer()

        writeFileSync(eliteProPicPath, image)
        await EliteProTech.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        await m.reply('Bot menu image updated successfully.')
    } catch (error) {
        await EliteProTech.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {})
        await m.reply(`Failed to update the bot menu image: ${error.message || String(error)}`)
    }
}

handler.command = ['setbotimage', 'setbotpp']
handler.owner = true

export default handler
