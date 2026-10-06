const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024

const GITHUB_HEADERS = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ELITE-PRO-V2'
}

const allowedDownloadHosts = new Set([
    'api.github.com',
    'github.com',
    'codeload.github.com',
    'registry.npmjs.org'
])

const requireOfficialDownloadUrl = value => {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !allowedDownloadHosts.has(url.hostname)) {
        throw new Error('The download source was not an official GitHub or npm URL.')
    }
    return url
}

const readBodyWithLimit = async response => {
    const reader = response.body?.getReader()
    if (!reader) return Buffer.alloc(0)

    const chunks = []
    let total = 0
    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        total += value.byteLength
        if (total > MAX_DOWNLOAD_BYTES) {
            await reader.cancel().catch(() => {})
            throw new Error('This file is too large. The bot limit is 25 MB.')
        }
        chunks.push(Buffer.from(value))
    }

    return Buffer.concat(chunks, total)
}

export const parseGitHubRepository = value => {
    const input = String(value || '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '')
    const match = input.match(/^([A-Za-z0-9][A-Za-z0-9_.-]{0,99})\/([A-Za-z0-9][A-Za-z0-9_.-]{0,99})$/)
    if (!match) throw new Error('Use a repository in the form owner/repository.')
    return { owner: match[1], repo: match[2] }
}

export const parseNpmSpec = value => {
    const input = String(value || '').trim()
    if (!input) throw new Error('Provide an npm package name.')

    const splitAt = input.startsWith('@')
        ? input.lastIndexOf('@')
        : input.indexOf('@')
    const packageName = splitAt > 0 ? input.slice(0, splitAt) : input
    const version = splitAt > 0 ? input.slice(splitAt + 1) : ''

    if (!/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i.test(packageName)) {
        throw new Error('That is not a valid npm package name.')
    }
    if (version && !/^[a-zA-Z0-9*+._-]+$/.test(version)) {
        throw new Error('Use a plain npm version or dist-tag.')
    }

    return { packageName: packageName.toLowerCase(), version }
}

export const downloadOfficialFile = async (value, { headers = {} } = {}) => {
    const url = requireOfficialDownloadUrl(value)
    const response = await fetch(url, {
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(120000)
    })

    if (!response.ok) {
        throw new Error(`Download failed (${response.status} ${response.statusText || 'HTTP error'}).`)
    }

    requireOfficialDownloadUrl(response.url)
    const size = Number(response.headers.get('content-length'))
    if (Number.isFinite(size) && size > MAX_DOWNLOAD_BYTES) {
        throw new Error(`This file is too large (${Math.ceil(size / 1024 / 1024)} MB). The bot limit is 25 MB.`)
    }

    const buffer = await readBodyWithLimit(response)

    return buffer
}

export const githubJson = async path => {
    const response = await fetch(`https://api.github.com${path}`, {
        headers: GITHUB_HEADERS,
        signal: AbortSignal.timeout(30000)
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
        const message = data.message || `GitHub request failed (${response.status}).`
        if (response.status === 403 && /rate limit/i.test(message)) {
            throw new Error('GitHub rate limit reached. Please try again in a few minutes.')
        }
        throw new Error(message)
    }

    return data
}

export const npmJson = async path => {
    const response = await fetch(`https://registry.npmjs.org${path}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(30000)
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || `npm request failed (${response.status}).`)
    return data
}

export const developerHeaders = GITHUB_HEADERS
