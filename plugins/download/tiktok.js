import axios from 'axios'

const API_URL = 'https://eliteprotech-apis.zone.id/download/tiktok'

const isTikTokUrl = value => {
    try {
        const url = new URL(value)
        const host = url.hostname.toLowerCase()
        return url.protocol === 'https:' && (host === 'tiktok.com' || host.endsWith('.tiktok.com'))
    } catch {
        return false
    }
}

const apiError = (data, fallback) => {
    if (typeof data === 'string' && data.trim()) return data.trim()
    if (typeof data?.error === 'string') return data.error
    if (data?.message) return String(data.message)
    return fallback
}

let handler = async (m, { text, EliteProTech }) => {
    const url = String(text || '').trim()
    if (!url) {
        return await m.reply(`Usage: ${global.prefix || ''}tiktok <TikTok link>`)
    }
    if (!isTikTokUrl(url)) {
        return await m.reply('Send a valid TikTok link.')
    }

    try {
        const response = await axios.get(API_URL, {
            params: { url },
            timeout: 90000,
            validateStatus: () => true,
            headers: { Accept: 'application/json' }
        })
        const data = response.data

        if (response.status < 200 || response.status >= 300 || data?.success === false) {
            return await m.reply(`TikTok download failed: ${apiError(data, `HTTP ${response.status}`)}`)
        }
        if (data?.type !== 'video' || !data.video) {
            return await m.reply('This TikTok does not contain a downloadable video.')
        }

        const caption = typeof data.title === 'string' ? data.title.trim() : ''
        return await EliteProTech.sendMessage(m.chat, {
            video: { url: data.video },
            mimetype: 'video/mp4',
            ...(caption ? { caption } : {})
        }, { quoted: m })
    } catch (error) {
        return await m.reply(`TikTok download failed: ${apiError(error.response?.data, error.message || 'Unable to reach the TikTok API.')}`)
    }
}

handler.command = ['tiktok', 'ttdl']

export default handler
