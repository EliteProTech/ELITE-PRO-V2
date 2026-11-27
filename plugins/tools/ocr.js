import axios from 'axios'
import fs from 'node:fs'
import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
import { uploadToEliteTempUrl } from '../../lib/uploader.js'

const API_URL = 'https://api.eliteprotech.site/tools/ocr'
const MAX_IMAGE_BYTES = 20 * 1024 * 1024

const apiError = (data, fallback) => {
    const value = data?.error || data?.message || data?.text
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 500)
    if (value && typeof value === 'object') {
        const message = value.message || value.error
        if (typeof message === 'string' && message.trim()) return message.trim().slice(0, 500)
        try { return JSON.stringify(value).slice(0, 500) } catch {}
    }
    return fallback
}

async function sendCopyResult(EliteProTech, m, text) {
    const content = `📝 *Text from image*\n\n${text}`
    const message = generateWAMessageFromContent(
        m.chat,
        {
            interactiveMessage: {
                body: { text: content },
                nativeFlowMessage: {
                    buttons: [{
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Copy text 📋',
                            copy_code: text
                        })
                    }],
                    messageParamsJson: ''
                },
                contextInfo: { pairedMediaType: 0 }
            }
        },
        { userJid: EliteProTech.user.id, quoted: m }
    )

    await EliteProTech.relayMessage(m.chat, message.message, {
        messageId: message.key.id,
        additionalNodes: [{
            tag: 'biz',
            attrs: {},
            content: [{
                tag: 'interactive',
                attrs: { type: 'native_flow', v: '1' },
                content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
            }]
        }]
    })
}

let handler = async (m, { EliteProTech, command }) => {
    const target = m.quoted?.mtype === 'imageMessage'
        ? m.quoted
        : m.mtype === 'imageMessage' ? m : null

    if (!target) {
        return await m.reply(`Reply to an image or send one with ${global.prefix || '.'}${command} to extract its text.`)
    }
    if (!String(target.mimetype || '').startsWith('image/')) {
        return await m.reply('Please use an image file.')
    }

    let tempFile
    try {
        tempFile = await target.download(true)
        if (!tempFile || !fs.existsSync(tempFile)) {
            return await m.reply('Could not download that image.')
        }
        if (fs.statSync(tempFile).size > MAX_IMAGE_BYTES) {
            return await m.reply('That image is too large to process (maximum 20 MB).')
        }

        const imageUrl = await uploadToEliteTempUrl(tempFile)
        const response = await axios.get(API_URL, {
            params: { url: imageUrl },
            timeout: 90000,
            validateStatus: () => true,
            headers: { Accept: 'application/json' }
        })
        const text = response.data?.text

        if (response.status < 200 || response.status >= 300 || response.data?.success !== true || typeof text !== 'string') {
            return await m.reply(`OCR failed: ${apiError(response.data, `HTTP ${response.status}`)}`)
        }
        if (!text.trim()) return await m.reply('No readable text was found in that image.')

        try {
            return await sendCopyResult(EliteProTech, m, text.trim())
        } catch {
            return await m.reply(`📝 *Text from image*\n\n${text.trim()}`)
        }
    } catch (error) {
        return await m.reply(`OCR failed: ${apiError(error.response?.data, error.message || String(error))}`)
    } finally {
        if (tempFile && fs.existsSync(tempFile)) {
            try { fs.unlinkSync(tempFile) } catch {}
        }
    }
}

handler.command = ['ocr', 'readimage', 'imagetext']

export default handler
