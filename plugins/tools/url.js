import fs from 'fs'
import { ImgBB, uploadToEliteProTechUrl, uploadToEliteTempUrl } from '../../lib/uploader.js'

const uploaders = {
    'eliteprotech-url': uploadToEliteProTechUrl,
    imgbb: ImgBB,
    tempurl: uploadToEliteTempUrl
}

let handler = async (m, { args }) => {
    const service = args[0]?.toLowerCase()
    const upload = uploaders[service]

    if (!upload) {
        return await m.reply(`Usage: ${global.prefix || ''}url eliteprotech-url | imgbb | tempurl\nReply to an image, video, audio, document, or sticker.`)
    }

    const target = m.quoted || (m.mtype === 'imageMessage' || m.mtype === 'videoMessage' || m.mtype === 'audioMessage' || m.mtype === 'documentMessage' || m.mtype === 'stickerMessage' ? m : null)
    if (!target) {
        return await m.reply('Reply to a supported media message first.')
    }

    let file
    try {
        file = await target.download(true)
        const url = await upload(file)
        await m.reply(url)
    } catch (error) {
        await m.reply(`Upload failed: ${error.message || String(error)}`)
    } finally {
        if (file && fs.existsSync(file)) {
            try { fs.unlinkSync(file) } catch {}
        }
    }
}

handler.command = ['url', 'tourl']

export default handler
