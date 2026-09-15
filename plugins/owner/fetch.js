import axios from 'axios'
import dns from 'dns/promises'
import net from 'net'

const MAX_REDIRECTS = 3
const MAX_RESPONSE_BYTES = 25 * 1024 * 1024

const isPrivateAddress = address => {
    if (net.isIPv4(address)) {
        const [first, second] = address.split('.').map(Number)
        return first === 10 ||
            first === 127 ||
            first === 0 ||
            first === 169 && second === 254 ||
            first === 172 && second >= 16 && second <= 31 ||
            first === 192 && second === 168
    }

    if (net.isIPv6(address)) {
        const value = address.toLowerCase()
        return value === '::1' || value === '::' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80:')
    }

    return true
}

const validateUrl = async value => {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http and https URLs are allowed.')
    if (url.username || url.password) throw new Error('URLs with login details are not allowed.')
    if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) throw new Error('Local URLs are not allowed.')

    const addresses = net.isIP(url.hostname)
        ? [{ address: url.hostname }]
        : await dns.lookup(url.hostname, { all: true })

    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
        throw new Error('Private or local network URLs are not allowed.')
    }

    return url
}

const normalizeUrl = value => {
    const input = String(value || '').trim()
    if (/^https?\/\//i.test(input)) return input
    if (/^https?\/\//i.test(input.replace(/:\/\//, '//'))) return input.replace(/^(https?)\/\//i, '$1://')
    return `https://${input}`
}

const fetchUrl = async input => {
    let url = await validateUrl(normalizeUrl(input))

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
        let response
        try {
            response = await axios.get(url.href, {
                responseType: 'arraybuffer',
                maxRedirects: 0,
                timeout: 30000,
                maxContentLength: MAX_RESPONSE_BYTES,
                validateStatus: () => true,
                headers: { 'User-Agent': `${global.botName || 'EliteProTech'} Fetch` }
            })
        } catch (error) {
            if (error.response) response = error.response
            else throw error
        }

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.location
            if (!location) throw new Error(`Redirect ${response.status} has no destination.`)
            url = await validateUrl(new URL(location, url).href)
            continue
        }

        const contentType = String(response.headers['content-type'] || '').toLowerCase()
        return {
            url: url.href,
            contentType,
            body: Buffer.from(response.data)
        }
    }

    throw new Error(`Too many redirects. Maximum is ${MAX_REDIRECTS}.`)
}

const fileNameFromUrl = value => {
    try {
        const name = decodeURIComponent(new URL(value).pathname.split('/').filter(Boolean).pop() || '')
        return name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'fetch-response'
    } catch {
        return 'fetch-response'
    }
}

let handler = async (m, { text, EliteProTech }) => {
    const input = text?.trim()
    if (!input) return await m.reply(`Usage: ${global.prefix || ''}fetch https://example.com/api`)

    try {
        const result = await fetchUrl(input)
        const fileName = fileNameFromUrl(result.url)

        if (result.contentType.startsWith('image/')) {
            return await EliteProTech.sendMessage(m.chat, {
                image: result.body,
                mimetype: result.contentType
            }, { quoted: m })
        }

        if (result.contentType.startsWith('video/')) {
            return await EliteProTech.sendMessage(m.chat, {
                video: result.body,
                mimetype: result.contentType,
                fileName
            }, { quoted: m })
        }

        if (result.contentType.startsWith('audio/')) {
            return await EliteProTech.sendMessage(m.chat, {
                audio: result.body,
                mimetype: result.contentType,
                fileName
            }, { quoted: m })
        }

        const isText = result.contentType.includes('text/') ||
            result.contentType.includes('json') ||
            result.contentType.includes('xml') ||
            result.contentType.includes('javascript')

        if (!isText) {
            return await EliteProTech.sendMessage(m.chat, {
                document: result.body,
                mimetype: result.contentType || 'application/octet-stream',
                fileName
            }, { quoted: m })
        }

        let output = result.body.toString('utf8')

        if (result.contentType.includes('json')) {
            try { output = JSON.stringify(JSON.parse(output), null, 2) } catch {}
        }

        if (Buffer.byteLength(output) <= 60000) {
            await m.reply(output)
        } else {
            await EliteProTech.sendMessage(m.chat, {
                document: Buffer.from(output),
                mimetype: result.contentType.includes('json') ? 'application/json' : 'text/plain',
                fileName: fileName.includes('.') ? fileName : 'fetch-response.txt'
            }, { quoted: m })
        }
    } catch (error) {
        await m.reply(`Fetch failed: ${error.message || String(error)}`)
    }
}

handler.command = ['fetch', 'get']
handler.owner = true

export default handler
