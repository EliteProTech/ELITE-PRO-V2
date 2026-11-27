import axios from 'axios'
import yts from 'yt-search'

const API_URL = 'https://api.eliteprotech.site/download/ytmp4'

function getVideoId(value) {
    try {
        const url = new URL(value)
        const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, '')
        let videoId = ''

        if (host === 'youtu.be') {
            videoId = url.pathname.slice(1).split('/')[0]
        } else if (host === 'youtube.com' || host === 'music.youtube.com') {
            if (url.pathname === '/watch') {
                videoId = url.searchParams.get('v') || ''
            } else {
                videoId = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)?.[1] || ''
            }
        }

        return url.protocol === 'https:' && /^[\w-]{6,20}$/.test(videoId) ? videoId : ''
    } catch {
        return ''
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
            !/^[\d.]+$/.test(host) &&
            !host.includes(':')
    } catch {
        return false
    }
}

function apiError(data, fallback) {
    if (typeof data === 'string' && data.trim()) return data.trim().slice(0, 200)
    if (typeof data?.error === 'string') return data.error.slice(0, 200)
    if (data?.message) return String(data.message).slice(0, 200)
    if (data?.result?.message) return String(data.result.message).slice(0, 200)
    return fallback
}

let handler = async (m, { text = '', command, EliteProTech }) => {
    const input = String(text).trim()
    if (!input) return m.reply(`Usage: ${global.prefix || '.'}${command} <YouTube link or search term>`)

    let video
    let videoId = getVideoId(input)
    if (!videoId && /^https?:\/\//i.test(input)) {
        return m.reply('Send a valid HTTPS YouTube video link or search term.')
    }

    try {
        if (videoId) {
            video = await yts({ videoId })
        } else {
            const search = await yts(input)
            video = search.videos?.[0]
            videoId = video?.videoId || ''
        }
    } catch (error) {
        return m.reply(`YouTube search failed: ${error.message || String(error)}`)
    }

    if (!videoId || !video) return m.reply(`No YouTube video found for "${input}".`)
    if (!video.seconds) return m.reply('That is a live stream, so I cannot download it as a video.')

    const watchUrl = `https://youtube.com/watch?v=${videoId}`

    try {
        const response = await axios.get(API_URL, {
            params: { url: watchUrl },
            timeout: 90000,
            validateStatus: () => true,
            headers: { Accept: 'application/json' }
        })
        const data = response.data
        const result = data?.result

        if (response.status < 200 || response.status >= 300 || data?.status !== true || !result) {
            return m.reply(`YouTube video download failed: ${apiError(data, `HTTP ${response.status}`)}`)
        }
        if (String(result.format || result.ext).toLowerCase() !== 'mp4' || !isSafeDownloadUrl(result.download_url)) {
            return m.reply('The download service did not return a valid MP4 link.')
        }

        const title = String(result.title || video.title || '').trim().slice(0, 1000)
        return await EliteProTech.sendMessage(m.chat, {
            video: { url: result.download_url },
            mimetype: 'video/mp4',
            ...(title ? { caption: title } : {})
        }, { quoted: m })
    } catch (error) {
        return m.reply(`YouTube video download failed: ${apiError(error.response?.data, error.message || 'Unable to reach the download service.')}`)
    }
}

handler.command = ['video', 'ytmp4']

export default handler
