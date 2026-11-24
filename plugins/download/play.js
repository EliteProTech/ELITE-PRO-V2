import axios from 'axios'
import yts from 'yt-search'

const API_URL = 'https://api.eliteprotech.site/download/ytmp3'

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
    Accept: '*/*'
}

const getVideoId = value => {
    try {
        const url = new URL(value)
        const host = url.hostname.toLowerCase().replace(/^www\.|^m\./, '')

        if (host === 'youtu.be') {
            return url.pathname.slice(1).split('/')[0] || ''
        }

        if (host === 'youtube.com' || host === 'music.youtube.com') {
            if (url.pathname === '/watch') {
                return url.searchParams.get('v') || ''
            }

            const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)
            return match?.[1] || ''
        }
    } catch {}

    return ''
}

const apiError = (data, fallback) => {
    if (typeof data === 'string' && data.trim()) return data.trim().slice(0, 200)
    if (typeof data?.error === 'string') return data.error
    if (data?.message) return String(data.message)
    return fallback
}

const safeFileName = title =>
    String(title || 'audio')
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100) || 'audio'

const isAudioFile = buffer => {
    if (buffer.length < 10 * 1024) return false
    if (buffer.subarray(0, 3).toString() === 'ID3') return true
    if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return true
    return buffer.subarray(4, 8).toString() === 'ftyp' ||
        buffer.subarray(0, 4).toString() === 'OggS'
}

const isSafeLink = value => {
    try {
        const url = new URL(value)
        const host = url.hostname.toLowerCase()

        return url.protocol === 'https:' &&
            host !== 'localhost' &&
            !/^[\d.]+$/.test(host) &&
            !host.includes(':')
    } catch {
        return false
    }
}

let handler = async (m, { EliteProTech, text = '' }) => {
    const query = String(text).trim()

    if (!query) {
        return m.reply(`*Usage:* ${global.prefix || '.'}play <song name or YouTube link>`)
    }
    let video

    try {
        const videoId = getVideoId(query)

        if (videoId) {
            video = await yts({ videoId })
        } else {
            const search = await yts(query)
            video = search.videos?.[0]
        }
    } catch (error) {
        return m.reply(`Search failed: ${error.message || error}`)
    }

    if (!video?.videoId) {
        return m.reply(`No results found for "${query}".`)
    }

    if (!video.seconds) {
        return m.reply('That is a live stream, so I cannot download it as audio.')
    }

    const watchUrl = `https://youtube.com/watch?v=${video.videoId}`

    try {
        const response = await axios.get(API_URL, {
            params: { url: watchUrl },
            timeout: 90000,
            validateStatus: () => true,
            headers: { Accept: 'application/json' }
        })

        const data = response.data
        const download = data?.download

        if (
            response.status < 200 ||
            response.status >= 300 ||
            data?.status !== true
        ) {
            return m.reply(
                `Audio download failed: ${apiError(data, `HTTP ${response.status}`)}`
            )
        }

        const downloadUrl = download?.downloadUrl

        if (!isSafeLink(downloadUrl)) {
            return m.reply('The API did not return a valid audio download URL.')
        }

        if (download?.format && download.format.toLowerCase() !== 'mp3') {
            return m.reply(`Unsupported audio format: ${download.format}`)
        }

        const title = download.title || video.title
        const thumbnail = download.thumbnail || video.thumbnail
        const duration = download.duration || video.timestamp || '-'

        const watchCard = `*${title}*\n\nChannel: ${video.author?.name || 'Unknown'}\nDuration: ${duration}\nViews: ${Number(video.views || 0).toLocaleString()}\n${watchUrl}\n\nDownloading audio...`

        try {
            if (thumbnail) {
                await EliteProTech.sendMessage(
                    m.chat,
                    {
                        image: { url: thumbnail },
                        caption: watchCard
                    },
                    { quoted: m }
                )
            } else {
                await m.reply(watchCard)
            }
        } catch {
            await m.reply(watchCard)
        }

        // Download the actual MP3
        const file = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            maxRedirects: 5,
            headers: BROWSER_HEADERS
        })

        const audio = Buffer.from(file.data)

        if (!isAudioFile(audio)) {
            return m.reply(
                'The download service returned something that is not a valid audio file. Try again.'
            )
        }

        const fileName = `${safeFileName(title)}.mp3`

        return await EliteProTech.sendMessage(
            m.chat,
            {
                audio,
                mimetype: 'audio/mpeg',
                fileName
            },
            { quoted: m }
        )

    } catch (error) {
        return m.reply(
            `Audio download failed: ${apiError(
                error.response?.data,
                error.message || 'Unable to reach the download service.'
            )}`
        )
    }
}

handler.command = ['play', 'ytmp3', 'yta']

export default handler
