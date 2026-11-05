import axios from 'axios'

const API_URL = 'https://api.neosoft.best/api/downloader/youtube'

function isYouTubeUrl(value) {
    try {
        const url = new URL(value)
        const host = url.hostname.toLowerCase().replace(/^www\./, '')
        return url.protocol === 'https:' && (
            host === 'youtu.be' ||
            host === 'youtube.com' ||
            host.endsWith('.youtube.com')
        )
    } catch {
        return false
    }
}

function isSafeDownloadUrl(value) {
    try {
        const url = new URL(value)
        const host = url.hostname.toLowerCase()
        return url.protocol === 'https:' &&
            !url.username &&
            !url.password &&
            host !== 'localhost' &&
            !host.endsWith('.localhost') &&
            !/^\d+(?:\.\d+){3}$/.test(host)
    } catch {
        return false
    }
}

function apiError(data, fallback) {
    if (typeof data === 'string' && data.trim()) return data.trim().slice(0, 200)
    if (typeof data?.error === 'string') return data.error.slice(0, 200)
    if (data?.message) return String(data.message).slice(0, 200)
    return fallback
}

let handler = async (m, { text = '', command, EliteProTech }) => {
    const url = String(text).trim()
    if (!url) return m.reply(`Usage: ${global.prefix || '.'}${command} <YouTube link>`)
    if (!isYouTubeUrl(url)) return m.reply('Send a valid HTTPS YouTube video link.')

    try {
        const response = await axios.get(API_URL, {
            params: { url, type: 'mp4' },
            timeout: 90000,
            validateStatus: () => true,
            headers: { Accept: 'application/json' }
        })
        const data = response.data

        if (response.status < 200 || response.status >= 300 || data?.status !== true) {
            return m.reply(`YouTube video download failed: ${apiError(data, `HTTP ${response.status}`)}`)
        }
        if (String(data.type).toLowerCase() !== 'mp4' || !isSafeDownloadUrl(data.download)) {
            return m.reply('The download service did not return a valid MP4 link.')
        }

        const title = typeof data.title === 'string' ? data.title.trim().slice(0, 1000) : ''
        return await EliteProTech.sendMessage(m.chat, {
            video: { url: data.download },
            mimetype: 'video/mp4',
            ...(title ? { caption: title } : {})
        }, { quoted: m })
    } catch (error) {
        return m.reply(`YouTube video download failed: ${apiError(error.response?.data, error.message || 'Unable to reach the download service.')}`)
    }
}

handler.command = ['video', 'ytmp4']

export default handler
