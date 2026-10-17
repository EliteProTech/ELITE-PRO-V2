import { createHash, getHashes } from 'node:crypto'

const MAX_MEDIA_BYTES = 25 * 1024 * 1024
const availableHashes = new Set(getHashes().map(name => name.toLowerCase()))

let handler = async (m, { args = [], text = '' }) => {
    const input = String(text || '').trim()
    const firstSpace = input.search(/\s/)
    const firstWord = (firstSpace === -1 ? input : input.slice(0, firstSpace)).toLowerCase()
    let algorithm = 'sha256'
    let value = input

    if (firstWord && availableHashes.has(firstWord)) {
        algorithm = firstWord
        value = firstSpace === -1 ? '' : input.slice(firstSpace).trim()
    }

    if (!availableHashes.has(algorithm)) {
        return await m.reply(`Unsupported hash algorithm: ${algorithm}`)
    }

    let data
    let source = 'text'

    if (value) {
        data = Buffer.from(value, 'utf8')
    } else if (m.quoted) {
        if (m.quoted.mimetype || m.quoted.msg?.mimetype) {
            source = 'replied file'
            data = await m.quoted.download()
            if (!data?.length) return await m.reply('Could not download the replied-to file.')
            if (data.length > MAX_MEDIA_BYTES) {
                return await m.reply('That file is too large to hash (maximum 25 MB).')
            }
        } else if (m.quoted.text) {
            source = 'replied text'
            data = Buffer.from(String(m.quoted.text), 'utf8')
        }
    }

    if (!data) {
        const prefix = global.prefix || '.'
        return await m.reply(`Hash text or reply to a file.\nUsage: ${prefix}hash [algorithm] <text>\nExample: ${prefix}hash sha256 hello`)
    }

    const digest = createHash(algorithm).update(data).digest('hex')
    return await m.reply(`🔐 ${algorithm.toUpperCase()} (${source})\n\`${digest}\``)
}

handler.command = ['hash']

export default handler
