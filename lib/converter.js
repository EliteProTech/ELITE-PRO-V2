import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'

const TMP_DIR = path.join(os.tmpdir(), 'elitepro-convert')
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

function tmpFile(ext) {
    return path.join(TMP_DIR, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`)
}

function runFfmpeg(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn('ffmpeg', ['-y', ...args])
        let stderr = ''
        proc.stderr.on('data', chunk => { stderr += chunk.toString() })
        proc.on('error', err => {
            reject(new Error(`ffmpeg not found or failed to start: ${err.message}`))
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
    const { default: sharp } = await import('sharp')
    const meta = await sharp(buffer, { animated: true }).metadata()
    const pages = meta.pages || 1
    const delays = (meta.delay && meta.delay.length === pages) ? meta.delay : new Array(pages).fill(100)

    const frameDir = path.join(TMP_DIR, `frames-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`)
    fs.mkdirSync(frameDir, { recursive: true })
    const listPath = path.join(frameDir, 'concat.txt')
    const outputPath = tmpFile('mp4')
    const framePaths = []

    try {
        for (let i = 0; i < pages; i++) {
            const framePath = path.join(frameDir, `frame_${String(i).padStart(4, '0')}.png`)
            const frameBuffer = await sharp(buffer, { page: i }).png().toBuffer()
            fs.writeFileSync(framePath, frameBuffer)
            framePaths.push({ path: framePath, duration: Math.max(delays[i] || 100, 20) / 1000 })
        }

        let listContent = ''
        for (const f of framePaths) {
            listContent += `file '${f.path.replace(/'/g, "'\\''")}'\nduration ${f.duration}\n`
        }
        if (framePaths.length) {
            listContent += `file '${framePaths[framePaths.length - 1].path.replace(/'/g, "'\\''")}'\n`
        }
        fs.writeFileSync(listPath, listContent)

        await runFfmpeg([
            '-f', 'concat',
            '-safe', '0',
            '-i', listPath,
            '-vsync', 'vfr',
            '-pix_fmt', 'yuv420p',
            '-c:v', 'libx264',
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            '-movflags', '+faststart',
            outputPath
        ])
        return fs.readFileSync(outputPath)
    } finally {
        try {
            for (const f of framePaths) if (fs.existsSync(f.path)) fs.unlinkSync(f.path)
            if (fs.existsSync(listPath)) fs.unlinkSync(listPath)
            if (fs.existsSync(frameDir)) fs.rmdirSync(frameDir)
        } catch {}
        cleanup(outputPath)
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
    const inputPath = await writeInput(buffer, inputExt)
    const outputPath = tmpFile('webp')
    try {
        const args = isVideo
            ? [
                '-i', inputPath,
                '-vcodec', 'libwebp',
                '-vf', "format=rgba,scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0",
                '-pix_fmt', 'yuva420p',
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
                '-t', '10',
                outputPath
            ]
            : [
                '-i', inputPath,
                '-vcodec', 'libwebp',
                '-vf', "format=rgba,scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white@0.0",
                '-pix_fmt', 'yuva420p',
                outputPath
            ]
        await runFfmpeg(args)
        return fs.readFileSync(outputPath)
    } finally {
        cleanup(inputPath, outputPath)
    }
}

export function addStickerExif(webpBuffer, { packname = '', author = '' } = {}) {
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

    const needsPadding = exif.length % 2 !== 0
    const chunkHeader = Buffer.alloc(8)
    chunkHeader.write('EXIF', 0, 'ascii')
    chunkHeader.writeUInt32LE(exif.length, 4)
    const padding = needsPadding ? Buffer.from([0x00]) : Buffer.alloc(0)

    const newBuffer = Buffer.concat([webpBuffer, chunkHeader, exif, padding])
    newBuffer.writeUInt32LE(newBuffer.length - 8, 4)
    return newBuffer
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
