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

function runImageMagick(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn('convert', args)
        let stderr = ''
        proc.stderr.on('data', chunk => { stderr += chunk.toString() })
        proc.on('error', err => {
            reject(new Error(`ImageMagick 'convert' not found — install it (e.g. "apt install imagemagick") to convert animated webp stickers. ${err.message}`))
        })
        proc.on('close', code => {
            if (code === 0) resolve()
            else reject(new Error(`convert exited with code ${code}\n${stderr.slice(-1000)}`))
        })
    })
}

async function animatedWebpToVideo(buffer) {
    const inputPath = await writeInput(buffer, 'webp')
    const gifPath = tmpFile('gif')
    const outputPath = tmpFile('mp4')
    try {
        await runImageMagick([inputPath, gifPath])
        await runFfmpeg([
            '-i', gifPath,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            '-movflags', '+faststart',
            outputPath
        ])
        return fs.readFileSync(outputPath)
    } finally {
        cleanup(inputPath, gifPath, outputPath)
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
                '-vf', "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0",
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
                '-vf', "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white@0.0",
                outputPath
            ]
        await runFfmpeg(args)
        return fs.readFileSync(outputPath)
    } finally {
        cleanup(inputPath, outputPath)
    }
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
