import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import webp from 'node-webpmux'
import sharp from 'sharp'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
let bundledFfmpegPath = null
try {
    const candidate = require('ffmpeg-static')
    if (candidate && fs.existsSync(candidate)) bundledFfmpegPath = candidate
} catch {}
const ffmpegPath = process.env.FFMPEG_PATH || bundledFfmpegPath || 'ffmpeg'

const TMP_DIR = path.join(os.tmpdir(), 'elitepro-convert')
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

function tmpFile(ext) {
    return path.join(TMP_DIR, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`)
}

function runFfmpeg(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath, ['-y', ...args])
        let stderr = ''
        proc.stderr.on('data', chunk => { stderr += chunk.toString() })
        proc.on('error', err => {
            if (err.code === 'ENOENT') {
                reject(new Error('FFmpeg is unavailable. Run npm install or npm rebuild ffmpeg-static --force, then restart the bot.'))
                return
            }dd
            reject(new Error(`ffmpeg failed to start: ${err.message}`))
        })
        proc.on('close', code => {
            if (code === 0) resolve()
            else reject(new Error(`ffmpeg exited with code ${code}\n${stderr.slice(-1500)}`))
        })
    })
}

async function writeInput(buffer, ext) {
    const inputPath = tmpFile(ext)
    fs.writeFileSync(inputPath, buffer)
    return inputPath
}

function cleanup(...files) {
    for (const f of files) {
        try { if (f && fs.existsSync(f)) fs.unlinkSync(f) } catch {}
    }
}

export async function toPTT(buffer, inputExt = 'bin') {
    const inputPath = await writeInput(buffer, inputExt)
    const outputPath = tmpFile('ogg')
    try {
        await runFfmpeg([
            '-i', inputPath,
            '-vn',
            '-c:a', 'libopus',
            '-ac', '1',
            '-ar', '48000',
            '-b:a', '64k',
            '-avoid_negative_ts', 'make_zero',
            outputPath
        ])
        return fs.readFileSync(outputPath)
    } finally {
        cleanup(inputPath, outputPath)
    }
}

export async function toAudio(buffer, inputExt = 'bin') {
    const inputPath = await writeInput(buffer, inputExt)
    const outputPath = tmpFile('mp3')
    try {
        await runFfmpeg([
            '-i', inputPath,
            '-vn',
            '-c:a', 'libmp3lame',
            '-b:a', '128k',
            '-ar', '44100',
            outputPath
        ])
        return fs.readFileSync(outputPath)
    } finally {
        cleanup(inputPath, outputPath)
    }
}

async function animatedWebpToVideo(buffer) {
    const rawPath = tmpFile('rgba')
    const outputPath = tmpFile('mp4')

    try {
        await webp.Image.initLib()
        const image = new webp.Image()
        await image.load(buffer)

        if (!image.hasAnim || !image.frames?.length) {
            throw new Error('This sticker is not animated.')
        }

        const frames = []
        for (let index = 0; index < image.frames.length; index++) {
            frames.push(await image.getFrameData(index))
        }

        fs.writeFileSync(rawPath, Buffer.concat(frames))
        await runFfmpeg([
            '-f', 'rawvideo',
            '-pixel_format', 'rgba',
            '-video_size', `${image.width}x${image.height}`,
            '-framerate', '15',
            '-i', rawPath,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            '-pix_fmt', 'yuv420p',
            '-an',
            '-movflags', '+faststart',
            outputPath
        ])
        return fs.readFileSync(outputPath)
    } finally {
        cleanup(rawPath, outputPath)
    }
}

export async function toVideo(buffer, inputExt = 'bin') {
    if (inputExt === 'webp') {
        return animatedWebpToVideo(buffer)
    }
    const inputPath = await writeInput(buffer, inputExt)
    const outputPath = tmpFile('mp4')
    try {
        await runFfmpeg([
            '-i', inputPath,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            outputPath
        ])
        return fs.readFileSync(outputPath)
    } finally {
        cleanup(inputPath, outputPath)
    }
}

export async function webpToMp4(buffer) {
    return toVideo(buffer, 'webp')
}

export async function toWebp(buffer, inputExt = 'bin', { isVideo = false } = {}) {
    if (!isVideo) {
        return sharp(buffer)
            .rotate()
            .resize({
                width: 512,
                height: 512,
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({ quality: 90, alphaQuality: 100 })
            .toBuffer()
    }

    const inputPath = await writeInput(buffer, inputExt)
    const outputPath = tmpFile('webp')
    try {
        await runFfmpeg([
            '-i', inputPath,
            '-vcodec', 'libwebp',
            '-vf', "fps=15,scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease",
            '-pix_fmt', 'yuv420p',
            '-loop', '0',
            '-preset', 'default',
            '-q:v', '70',
            '-an',
            '-fps_mode', 'cfr',
            '-t', '10',
            outputPath
        ])
        return fs.readFileSync(outputPath)
    } finally {
        cleanup(inputPath, outputPath)
    }
}

export async function addStickerExif(webpBuffer, { packname = '', author = '' } = {}) {
    const exifData = {
        'sticker-pack-id': crypto.randomBytes(16).toString('hex'),
        'sticker-pack-name': packname,
        'sticker-pack-publisher': author,
        'emojis': ['🤖']
    }

    const exifHeader = Buffer.from([
        0x49, 0x49, 0x2A, 0x00,
        0x08, 0x00, 0x00, 0x00,
        0x01, 0x00,
        0x41, 0x57, 0x07, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x16, 0x00, 0x00, 0x00
    ])

    const jsonBuffer = Buffer.from(JSON.stringify(exifData), 'utf-8')
    const exif = Buffer.concat([exifHeader, jsonBuffer])
    exif.writeUIntLE(jsonBuffer.length, 14, 4)

    const image = new webp.Image()
    await image.load(webpBuffer)
    image.exif = exif
    return image.save(null, { exif: true })
}

export async function videoThumbnail(buffer, inputExt = 'mp4', atSeconds = 0) {
    const inputPath = await writeInput(buffer, inputExt)
    const outputPath = tmpFile('jpg')
    try {
        await runFfmpeg([
            '-ss', String(atSeconds),
            '-i', inputPath,
            '-frames:v', '1',
            '-q:v', '3',
            outputPath
        ])
        return fs.readFileSync(outputPath)
    } finally {
        cleanup(inputPath, outputPath)
    }
}
