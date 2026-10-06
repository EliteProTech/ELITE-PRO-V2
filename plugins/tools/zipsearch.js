import { unzipSync } from 'fflate'

const MAX_ARCHIVE_BYTES = 15 * 1024 * 1024
const MAX_ENTRIES = 300
const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_TOTAL_BYTES = 20 * 1024 * 1024
const MAX_RESULTS = 100
const textFile = /\.(?:js|mjs|cjs|json|txt|ts|tsx|jsx|html?|css|xml|ya?ml|md|env|ini|toml|py|java|php|rb|go|rs|sh)$/i

const listEntries = archive => {
    const minimumEocdOffset = Math.max(0, archive.length - 0x10000 - 22)
    let eocd = -1
    for (let offset = archive.length - 22; offset >= minimumEocdOffset; offset--) {
        if (archive.readUInt32LE(offset) === 0x06054b50) {
            eocd = offset
            break
        }
    }
    if (eocd < 0) throw new Error('This is not a valid ZIP archive.')

    const entriesCount = archive.readUInt16LE(eocd + 10)
    const directoryOffset = archive.readUInt32LE(eocd + 16)
    if (entriesCount === 0xffff || directoryOffset === 0xffffffff) {
        throw new Error('ZIP64 archives are not supported.')
    }
    if (entriesCount > MAX_ENTRIES) {
        throw new Error(`The archive has too many files. Maximum: ${MAX_ENTRIES}.`)
    }

    const entries = []
    let offset = directoryOffset
    let total = 0
    for (let index = 0; index < entriesCount; index++) {
        if (offset + 46 > archive.length || archive.readUInt32LE(offset) !== 0x02014b50) {
            throw new Error('The ZIP directory is invalid.')
        }

        const compressedSize = archive.readUInt32LE(offset + 20)
        const uncompressedSize = archive.readUInt32LE(offset + 24)
        const nameLength = archive.readUInt16LE(offset + 28)
        const extraLength = archive.readUInt16LE(offset + 30)
        const commentLength = archive.readUInt16LE(offset + 32)
        const nameEnd = offset + 46 + nameLength
        if (nameEnd > archive.length) throw new Error('The ZIP contains an invalid filename.')

        const name = archive.subarray(offset + 46, nameEnd).toString('utf8')
        offset = nameEnd + extraLength + commentLength

        if (!name || name.endsWith('/') || !textFile.test(name)) continue
        if (compressedSize > MAX_ARCHIVE_BYTES || uncompressedSize > MAX_FILE_BYTES) continue

        total += uncompressedSize
        if (total > MAX_TOTAL_BYTES) {
            throw new Error('The searchable files are too large. Please use a smaller ZIP.')
        }
        entries.push(name)
    }

    return entries
}

let handler = async (m, { text }) => {
    const query = String(text || '').trim()
    if (!m.quoted) return await m.reply('Reply to a ZIP file.')
    if (!query) {
        return await m.reply(`Usage: ${global.prefix || ''}zipsearch <search term>\n\nExample: ${global.prefix || ''}zipsearch groupstatus`)
    }
    if (query.length > 200) return await m.reply('Use a search term of 200 characters or fewer.')

    try {
        const archive = await m.quoted.download()
        if (!archive?.length) throw new Error('The quoted message has no downloadable file.')
        if (archive.length > MAX_ARCHIVE_BYTES) {
            throw new Error('The ZIP is too large. Maximum archive size is 15 MB.')
        }

        const entries = listEntries(archive)
        if (!entries.length) return await m.reply('No searchable text files were found in that ZIP.')

        const allowedNames = new Set(entries)
        const files = unzipSync(archive, { filter: file => allowedNames.has(file.name) })
        const search = query.toLowerCase()
        const results = []

        for (const [name, content] of Object.entries(files)) {
            const lines = Buffer.from(content).toString('utf8').split(/\r?\n/)
            for (let index = 0; index < lines.length; index++) {
                if (!lines[index].toLowerCase().includes(search)) continue
                results.push(`📄 ${name}:${index + 1}\n${lines[index].trim().slice(0, 500)}`)
                if (results.length >= MAX_RESULTS) break
            }
            if (results.length >= MAX_RESULTS) break
        }

        if (!results.length) return await m.reply(`No matches found for: ${query}`)

        const suffix = results.length === MAX_RESULTS ? '\n\nResults limited to the first 100 matches.' : ''
        return await m.reply(`🔎 *ZIP SEARCH*\n\nQuery: ${query}\nMatches: ${results.length}\n\n${results.join('\n\n')}${suffix}`.slice(0, 60000))
    } catch (error) {
        return await m.reply(`ZIP search failed: ${error.message || String(error)}`)
    }
}

handler.command = ['zipsearch', 'zips']

export default handler
