import axios from 'axios'

const API_URL = 'https://eliteprotech-apis.zone.id/download/apk'
const MAX_APK_BYTES = 150 * 1024 * 1024

const formatSize = bytes => {
    const value = Number(bytes)
    if (!Number.isFinite(value) || value <= 0) return 'size unavailable'
    const units = ['B', 'KB', 'MB', 'GB']
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
    return `${(value / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`
}

const safeFilename = value => String(value || 'app')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/[. ]+$/g, '')
    .slice(0, 100) || 'app'

const apiError = data => data?.error || data?.message || 'The APK search service returned an invalid response.'

async function searchApks(query) {
    const response = await axios.get(API_URL, {
        params: { q: query },
        timeout: 45000,
        validateStatus: () => true,
        headers: { Accept: 'application/json' }
    })

    if (response.status < 200 || response.status >= 300) {
        throw new Error(typeof response.data === 'string' ? response.data : apiError(response.data))
    }
    if (response.data?.status !== true || !Array.isArray(response.data.results)) {
        throw new Error(apiError(response.data))
    }
    return response.data.results
}

function trustedApkUrl(value) {
    let url
    try {
        url = new URL(value)
    } catch {
        throw new Error('The result did not contain a valid APK link.')
    }
    if (url.protocol !== 'https:' || !(url.hostname === 'aptoide.com' || url.hostname.endsWith('.aptoide.com')) || !url.pathname.toLowerCase().endsWith('.apk')) {
        throw new Error('The APK link is not from an approved Aptoide download host.')
    }
    return url.toString()
}

let handler = async (m, { text = '', EliteProTech }) => {
    const query = String(text).trim()
    if (!query || query.length > 120) {
        return await m.reply(`Usage: ${global.prefix || '.'}apk <app name>\nExample: ${global.prefix || '.'}apk whatsapp`)
    }

    try {
        const results = await searchApks(query)
        if (!results.length) return await m.reply(`No APK results found for "${query}".`)

        const app = results[0]
        const fileInfo = app?.file || {}
        const apkUrl = trustedApkUrl(fileInfo.path || fileInfo.path_alt)
        const reportedSize = Number(fileInfo.filesize || app?.size)
        if (Number.isFinite(reportedSize) && reportedSize > MAX_APK_BYTES) {
            return await m.reply(`That APK is too large to send (maximum ${formatSize(MAX_APK_BYTES)}).`)
        }

        const response = await axios.get(apkUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            maxContentLength: MAX_APK_BYTES,
            maxBodyLength: MAX_APK_BYTES,
            maxRedirects: 5,
            validateStatus: () => true
        })
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`APK download failed (HTTP ${response.status}).`)
        }

        const apk = Buffer.from(response.data)
        if (!apk.length) throw new Error('The APK download was empty.')
        if (apk.length > MAX_APK_BYTES) throw new Error(`The APK exceeds the ${formatSize(MAX_APK_BYTES)} send limit.`)

        const version = fileInfo.vername ? ` v${fileInfo.vername}` : ''
        const name = safeFilename(app?.name)
        return await EliteProTech.sendMessage(m.chat, {
            document: apk,
            mimetype: 'application/vnd.android.package-archive',
            fileName: `${name}${version ? `-${safeFilename(fileInfo.vername)}` : ''}.apk`,
            caption: `📦 *${app?.name || 'APK'}*${version}\nPackage: ${app?.package || 'unknown'}`
        }, { quoted: m })
    } catch (error) {
        return await m.reply(`APK download failed: ${error.message || String(error)}`)
    }
}

handler.command = ['apk']

export default handler
