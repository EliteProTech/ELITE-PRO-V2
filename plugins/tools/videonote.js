import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
let bundledFfmpegPath = null
try {
    const candidate = require('ffmpeg-static')
    if (candidate && fs.existsSync(candidate)) bundledFfmpegPath = candidate
} catch {}
const ffmpegPath = process.env.FFMPEG_PATH || bundledFfmpegPath || 'ffmpeg'

const MAX_SECONDS = 60
const SIZE = 480

function runFfmpeg(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath, ['-y', ...args])
        let stderr = ''
        proc.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-1500) })
        proc.on('error', error => reject(new Error(error.code === 'ENOENT' ? 'FFmpeg is unavailable. Run npm install or npm rebuild ffmpeg-static --force, then restart the bot.' : error.message)))
        proc.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}\n${stderr}`)))
    })
}

async function toVideoNote(buffer, ext) {
    const id = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    const input = path.join(os.tmpdir(), `ptv-${id}-in.${ext}`)
    const output = path.join(os.tmpdir(), `ptv-${id}-out.mp4`)
    fs.writeFileSync(input, buffer)
    try {
        await runFfmpeg([
            '-i', input,
            '-t', String(MAX_SECONDS),
            '-vf', `crop='min(iw,ih)':'min(iw,ih)',scale=${SIZE}:${SIZE},setsar=1`,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '28',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-b:a', '96k',
            '-movflags', '+faststart',
            output
        ])
        return fs.readFileSync(output)
    } finally {
        fs.rm(input, () => {})
        fs.rm(output, () => {})
    }
}

let handler = async (m, { EliteProTech }) => {
    const target = m.quoted?.mtype === 'videoMessage' ? m.quoted : (m.mtype === 'videoMessage' ? m : null)
    if (!target) return m.reply(`Reply to a video with ${global.prefix || '.'}ptv to send it as a video note.`)

    try {
        const mime = target.mimetype || ''
        const ext = mime.includes('webm') ? 'webm' : mime.includes('quicktime') ? 'mov' : 'mp4'
        const video = await toVideoNote(await target.download(), ext)
        await EliteProTech.sendMessage(m.chat, { video, ptv: true }, { quoted: m })
    } catch (error) {
        await m.reply(`Could not send the video note: ${error.message}`)
    }
}

handler.command = ['ptv', 'videonote', 'vnote']

export default handler
