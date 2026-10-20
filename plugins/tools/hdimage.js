import axios from 'axios'
import fs from 'node:fs'
import { uploadToEliteTempUrl } from '../../lib/uploader.js'

const API_URL = 'https://eliteprotech-apis.zone.id/image/jpghd'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function getApiError(data, status) {
    const message = data?.error || data?.message || data?.msg
    if (typeof message === 'string' && message.trim()) return message.trim()
    if (status) return `The image API returned HTTP ${status}.`
    return 'The image API did not return a usable result.'
}

let handler = async (m, { EliteProTech, text = '' }) => {
    const input = String(text).trim()
    const target = m.quoted?.mtype === 'imageMessage'
        ? m.quoted
        : m.mtype === 'imageMessage' ? m : null

    if (!input && !target) {
        return await m.reply(`Reply to an image or provide an image URL.\nExample: ${global.prefix || '.'}jpghd https://example.com/image.jpg`)
    }

    let imageUrl = input
    let tempFile

    try {
        if (input) {
            let parsed
            try {
                parsed = new URL(input)
            } catch {
                return await m.reply('Please provide a valid image URL beginning with http:// or https://.')
            }
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return await m.reply('Please provide a valid image URL beginning with http:// or https://.')
            }
            imageUrl = parsed.toString()
        } else {
            if (!String(target.mimetype || '').startsWith('image/')) {
                return await m.reply('Reply to an image, not another type of media.')
            }

            tempFile = await target.download(true)
            if (!tempFile || !fs.existsSync(tempFile)) {
                return await m.reply('Could not download the image.')
            }
            if (fs.statSync(tempFile).size > MAX_IMAGE_BYTES) {
                return await m.reply('That image is too large to enhance (maximum 10 MB).')
            }
            imageUrl = await uploadToEliteTempUrl(tempFile)
        }

        const response = await axios.get(API_URL, {
            params: { url: imageUrl },
            timeout: 120_000,
            validateStatus: () => true
        })
        const data = response.data

        if (response.status < 200 || response.status >= 300 || data?.status !== true || typeof data?.result !== 'string') {
            return await m.reply(`Image enhancement failed: ${getApiError(data, response.status)}`)
        }

        let resultUrl
        try {
            resultUrl = new URL(data.result)
        } catch {
            return await m.reply('Image enhancement failed: the API returned an invalid image URL.')
        }
        if (resultUrl.protocol !== 'https:' && resultUrl.protocol !== 'http:') {
            return await m.reply('Image enhancement failed: the API returned an invalid image URL.')
        }

        return await EliteProTech.sendMessage(m.chat, {
            image: { url: resultUrl.toString() },
            mimetype: 'image/jpeg'
        }, { quoted: m })
    } catch (error) {
        const responseData = error.response?.data
        const message = responseData
            ? getApiError(responseData, error.response.status)
            : error.message || String(error)
        return await m.reply(`Image enhancement failed: ${message}`)
    } finally {
        if (tempFile && fs.existsSync(tempFile)) {
            try { fs.unlinkSync(tempFile) } catch {}
        }
    }
}

handler.command = ['hdimage', 'enhance', 'hd']

export default handler
