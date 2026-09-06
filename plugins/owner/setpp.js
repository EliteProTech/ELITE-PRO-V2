import sharp from 'sharp'

let handler = async (m, { EliteProTech, args, command }) => {
    const requested = args[0]?.toLowerCase()
    const fullCommand = command === 'setfullpp' || command === 'setfullprofilepicture'
    const mode = requested || (fullCommand ? 'full' : 'square')

    if (!['square', 'full'].includes(mode)) {
        return await m.reply(`Usage: ${global.prefix || ''}setpp square\n${global.prefix || ''}setfullpp full`)
    }

    if (!m.quoted) {
        return await m.reply(`Reply to an image.\n\nUsage: ${global.prefix || ''}setpp square\n${global.prefix || ''}setfullpp full`)
    }

    const mime = m.quoted.mimetype || m.quoted.msg?.mimetype || ''
    if (m.quoted.mtype !== 'imageMessage' && !mime.startsWith('image/')) {
        return await m.reply('Reply to an image.')
    }

    try {
        await EliteProTech.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } })

        const media = await m.quoted.download()
        const processor = sharp(media).rotate()
        if (mode === 'square') {
            processor.resize(720, 720, { fit: 'cover', position: 'centre' })
        } else {
            processor.resize(720, 720, { fit: 'inside', withoutEnlargement: true })
        }
        const image = await processor
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
        await m.reply(`${mode === 'square' ? 'Square' : 'Full'} profile picture updated successfully.`)
    } catch (error) {
        await EliteProTech.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {})
        await m.reply(`Failed to update profile picture: ${error.message || String(error)}`)
    }
}

handler.command = ['setpp', 'setfullpp', 'setfullprofilepicture']
handler.owner = true

export default handler
