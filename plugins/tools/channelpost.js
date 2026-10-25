import crypto from 'crypto'
import { proto, getContentType } from '@whiskeysockets/baileys'

const MEDIA_HOST = 'https://mmg.whatsapp.net'
const MAX_MEDIA_BYTES = (Number(process.env.MAX_DOWNLOAD_MB) || 64) * 1024 * 1024

function findChannelPostLink(value = '') {
    const match = String(value).match(/(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/[A-Za-z0-9_-]+\/\d+(?:\?[^\s<>]*)?/i)
    return match?.[0]?.replace(/[),.;!?)\]}]+$/g, '') || ''
}

function parseChannelPostLink(input) {
    let url
    try {
        url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
    } catch {
        return null
    }

    if (url.hostname.toLowerCase().replace(/^www\./, '') !== 'whatsapp.com') return null

    const match = url.pathname.match(/^\/channel\/([A-Za-z0-9_-]+)\/(\d+)\/?$/)
    if (!match) return null

    const postId = Number(match[2])
    if (!Number.isSafeInteger(postId) || postId < 1) return null

    return { inviteCode: match[1], postId }
}

function findPostNodes(node, matches = []) {
    if (!node || typeof node !== 'object') return matches

    if (!Array.isArray(node) && node.tag === 'message' && node.attrs) {
        matches.push(node)
    }

    const children = Array.isArray(node) ? node : node.content
    if (Array.isArray(children)) {
        for (const child of children) findPostNodes(child, matches)
    }

    return matches
}

function getChild(node, tag) {
    if (!Array.isArray(node?.content)) return null
    return node.content.find(child => child?.tag === tag) || null
}

function decodePost(node) {
    const plaintext = getChild(node, 'plaintext')
    if (!plaintext?.content) return null

    const bytes = typeof plaintext.content === 'string'
        ? Buffer.from(plaintext.content, 'binary')
        : Buffer.from(plaintext.content)
    return proto.Message.decode(bytes)
}

async function downloadMedia(media) {
    const url = media.url?.startsWith(`${MEDIA_HOST}/`)
        ? media.url
        : media.directPath ? `${MEDIA_HOST}${media.directPath}` : ''
    if (!url) throw new Error('The post has no media link.')

    const declared = Number(media.fileLength?.toNumber?.() ?? media.fileLength) || 0
    if (declared > MAX_MEDIA_BYTES) throw new Error(`Media is too large (${Math.round(declared / 1048576)} MB).`)

    const response = await fetch(url, { signal: AbortSignal.timeout(60000) })
    if (!response.ok) throw new Error(`Media download failed (${response.status}).`)

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length > MAX_MEDIA_BYTES) throw new Error(`Media is too large (${Math.round(buffer.length / 1048576)} MB).`)

    if (media.fileSha256?.length) {
        const hash = crypto.createHash('sha256').update(buffer).digest()
        if (!hash.equals(Buffer.from(media.fileSha256))) throw new Error('Downloaded media did not match the post (it may be encrypted or changed).')
    }

    return buffer
}

async function sendPost(EliteProTech, m, content) {
    const type = getContentType(content)
    const body = content[type]
    const options = { quoted: m }

    if (type === 'conversation') return EliteProTech.sendMessage(m.chat, { text: body }, options)
    if (type === 'extendedTextMessage') return EliteProTech.sendMessage(m.chat, { text: body.text || '' }, options)

    const caption = body?.caption || ''
    if (type === 'imageMessage') return EliteProTech.sendMessage(m.chat, { image: await downloadMedia(body), caption }, options)
    if (type === 'videoMessage') return EliteProTech.sendMessage(m.chat, { video: await downloadMedia(body), caption, gifPlayback: body.gifPlayback === true }, options)
    if (type === 'audioMessage') return EliteProTech.sendMessage(m.chat, { audio: await downloadMedia(body), mimetype: body.mimetype || 'audio/mpeg', ptt: body.ptt === true }, options)
    if (type === 'documentMessage') return EliteProTech.sendMessage(m.chat, { document: await downloadMedia(body), mimetype: body.mimetype || 'application/octet-stream', fileName: body.fileName || 'file', caption }, options)
    if (type === 'stickerMessage') return EliteProTech.sendMessage(m.chat, { sticker: await downloadMedia(body) }, options)

    return EliteProTech.sendMessage(m.chat, { forward: { key: { remoteJid: m.chat, id: 'channel', fromMe: false }, message: content }, force: true }, options)
}

const handler = async (m, { EliteProTech, text = '' }) => {
    const input = findChannelPostLink(text) || findChannelPostLink(m.quoted?.text || m.quoted?.caption || '')
    if (!input) {
        const prefix = global.prefix || '.'
        return m.reply(`Send a WhatsApp Channel post link.\nExample: ${prefix}channelpost https://whatsapp.com/channel/CHANNEL_CODE/POST_ID`)
    }

    const link = parseChannelPostLink(input)
    if (!link) return m.reply('That is not a valid WhatsApp Channel post link. It should include the channel code and post ID.')

    if (typeof EliteProTech.newsletterMetadata !== 'function' || typeof EliteProTech.query !== 'function') {
        return m.reply('This Baileys connection does not support fetching channel posts.')
    }

    try {
        const metadata = await EliteProTech.newsletterMetadata('invite', link.inviteCode)
        if (!metadata?.id) return m.reply('Could not resolve that channel. Check that the link is valid.')

        const result = await EliteProTech.query({
            tag: 'iq',
            attrs: { id: EliteProTech.generateMessageTag(), type: 'get', xmlns: 'newsletter', to: 's.whatsapp.net' },
            content: [{
                tag: 'messages',
                attrs: { type: 'jid', jid: metadata.id, count: '5', after: String(link.postId - 1) }
            }]
        })

        const postNode = findPostNodes(result).find(node =>
            String(node.attrs.server_id || node.attrs.message_id || '') === String(link.postId)
        )
        if (!postNode) {
            return m.reply('I could not find that post in the channel history. The post may be unavailable, or WhatsApp may not have returned it.')
        }

        const content = decodePost(postNode)
        if (!content || !getContentType(content)) {
            return m.reply('That channel post did not include a readable message.')
        }

        await sendPost(EliteProTech, m, content)
    } catch (error) {
        console.error('[CHANNEL POST]', error)
        await m.reply(`Could not fetch that channel post: ${error?.message || error}`)
    }
}

handler.command = ['channelpost', 'getchannelpost', 'getpost']
handler.category = 'tools'

export default handler
