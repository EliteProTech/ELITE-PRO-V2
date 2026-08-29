import sharp from 'sharp'

let handler = async (m, { EliteProTech }) => {
    if (!m.quoted) {
        return await m.reply(`Reply to an image.\n\nUsage: ${global.prefix || ''}setpp`)
    }

    const mime = m.quoted.mimetype || m.quoted.msg?.mimetype || ''
    if (m.quoted.mtype !== 'imageMessage' && !mime.startsWith('image/')) {
        return await m.reply('Reply to an image.')
    }

    try {
        await EliteProTech.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } })

        const media = await m.quoted.download()
        const image = await sharp(media)
            .rotate()
            .resize(720, 720, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 90 })
            .toBuffer()

        await EliteProTech.query({
            tag: 'iq',
            attrs: {
                to: '@s.whatsapp.net',
                type: 'set',
                xmlns: 'w:profile:picture'
            },
            content: [{
                tag: 'picture',
                attrs: { type: 'image' },
                content: image
            }]
        })

        await EliteProTech.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        await m.reply('Full profile picture updated successfully.')
    } catch (error) {
        await EliteProTech.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {})
        await m.reply(`Failed to update profile picture: ${error.message || String(error)}`)
    }
}

handler.command = ['setpp', 'setfullpp', 'setfullprofilepicture']
handler.owner = true

export default handler
