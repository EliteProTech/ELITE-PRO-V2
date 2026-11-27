import axios from 'axios'
import fs from 'node:fs'
import { uploadToEliteTempUrl } from '../../lib/uploader.js'

const API_URL = 'https://api.eliteprotech.site/tools/shazam'
const MAX_MEDIA_BYTES = 50 * 1024 * 1024
const SUPPORTED_TYPES = new Set(['audioMessage', 'videoMessage'])

function formatDuration(milliseconds) {
    const seconds = Math.floor(Number(milliseconds) / 1000)
    if (!Number.isFinite(seconds) || seconds <= 0) return ''
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

function formatResult(data) {
    const title = String(data.title || 'Unknown track').trim()
    const artist = String(data.artist || 'Unknown artist').trim()
    const lines = [`🎵 *${title}*`, `Artist: ${artist}`]
    if (data.album) lines.push(`Album: ${data.album}`)
    if (data.release_date) lines.push(`Released: ${data.release_date}`)
    if (data.duration_ms) lines.push(`Duration: ${formatDuration(data.duration_ms)}`)
    if (data.genres?.length) lines.push(`Genre: ${data.genres.join(', ')}`)
    if (Number.isFinite(Number(data.score))) lines.push(`Match: ${data.score}%`)
    if (data.label) lines.push(`Label: ${data.label}`)
    return lines.join('\n')
}

let handler = async (m, { EliteProTech, command }) => {
    const target = SUPPORTED_TYPES.has(m.quoted?.mtype)
        ? m.quoted
        : SUPPORTED_TYPES.has(m.mtype) ? m : null

    if (!target) {
        return await m.reply(`Reply to audio or video with ${global.prefix || '.'}${command} to identify its music.`)
    }

    let tempFile
    try {
        tempFile = await target.download(true)
        if (!tempFile || !fs.existsSync(tempFile)) {
            return await m.reply('Could not download the audio or video.')
        }
        if (fs.statSync(tempFile).size > MAX_MEDIA_BYTES) {
            return await m.reply('That media is too large to identify (maximum 50 MB).')
        }

        const mediaUrl = await uploadToEliteTempUrl(tempFile)
        const response = await axios.get(API_URL, {
            params: { url: mediaUrl },
            timeout: 90000,
            validateStatus: () => true,
            headers: { Accept: 'application/json' }
        })
        const result = response.data?.data

        if (response.status < 200 || response.status >= 300 || response.data?.success !== true || !result?.title) {
            const message = response.data?.error || response.data?.message || response.data?.data?.message
            return await m.reply(`Music recognition failed: ${message || `HTTP ${response.status}`}`)
        }

        const text = formatResult(result)
        if (result.thumbnail) {
            try {
                return await EliteProTech.sendMessage(m.chat, {
                    image: { url: result.thumbnail },
                    caption: text
                }, { quoted: m })
            } catch {}
        }
        return await m.reply(text)
    } catch (error) {
        const message = typeof error.response?.data === 'string'
            ? error.response.data.slice(0, 200)
            : error.response?.data?.error || error.response?.data?.message || error.message || String(error)
        return await m.reply(`Music recognition failed: ${message}`)
    } finally {
        if (tempFile && fs.existsSync(tempFile)) {
            try { fs.unlinkSync(tempFile) } catch {}
        }
    }
}

handler.command = ['shazam', 'whatmusic', 'identify']

export default handler
