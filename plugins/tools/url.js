import fs from 'fs'
import { ImgBB, uploadToEliteProTechUrl, uploadToEliteTempUrl } from '../../lib/uploader.js'

const uploaders = {
    url: uploadToEliteProTechUrl,
    tourl: uploadToEliteProTechUrl,
    'eliteprotech-url': uploadToEliteProTechUrl,
    tempurl: uploadToEliteTempUrl,
    imgbb: ImgBB
}

let handler = async (m, { command }) => {
    const upload = uploaders[String(command || '').toLowerCase()]

    const target = m.quoted || (m.mtype === 'imageMessage' || m.mtype === 'videoMessage' || m.mtype === 'audioMessage' || m.mtype === 'documentMessage' || m.mtype === 'stickerMessage' ? m : null)
    if (!target) {
        return await m.reply(`Reply to supported media with ${global.prefix || '.'}url, ${global.prefix || '.'}tempurl, or ${global.prefix || '.'}imgbb.`)
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

handler.command = ['url', 'tourl', 'eliteprotech-url', 'tempurl', 'imgbb']

export default handler
