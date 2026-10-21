import { proto } from '@whiskeysockets/baileys'

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

function decodePost(node, channelJid) {
    const plaintext = getChild(node, 'plaintext')
    if (!plaintext?.content) return null

    const bytes = typeof plaintext.content === 'string'
        ? Buffer.from(plaintext.content, 'binary')
        : Buffer.from(plaintext.content)
    const content = proto.Message.decode(bytes)
    const id = node.attrs.message_id || node.attrs.server_id
    if (!id) return null

    const timestamp = Number(node.attrs.t)
    return {
        key: { remoteJid: channelJid, id: String(id), fromMe: false },
        message: content,
        messageTimestamp: Number.isFinite(timestamp) ? timestamp : Math.floor(Date.now() / 1000)
    }
}

const handler = async (m, { EliteProTech, text = '' }) => {
    const input = findChannelPostLink(text) || findChannelPostLink(m.quoted?.text || m.quoted?.caption || '')
    if (!input) {
        const prefix = global.prefix || '.'
        return m.reply(`Send a WhatsApp Channel post link.\nExample: ${prefix}channelpost https://whatsapp.com/channel/CHANNEL_CODE/POST_ID`)
    }

    const link = parseChannelPostLink(input)
    if (!link) return m.reply('That is not a valid WhatsApp Channel post link. It should include the channel code and post ID.')

    if (typeof EliteProTech.newsletterMetadata !== 'function' || typeof EliteProTech.newsletterFetchMessages !== 'function') {
        return m.reply('This Baileys connection does not support fetching channel posts.')
    }

    try {
        const metadata = await EliteProTech.newsletterMetadata('invite', link.inviteCode)
        if (!metadata?.id) return m.reply('Could not resolve that channel. Check that the link is valid.')

        // Fetch just beyond the linked server ID, then verify the returned post ID.
        const result = await EliteProTech.newsletterFetchMessages(
            metadata.id,
            5,
            undefined,
            Math.max(0, link.postId - 1)
        )
        const postNode = findPostNodes(result).find(node =>
            String(node.attrs.server_id || node.attrs.message_id || '') === String(link.postId)
        )

        if (!postNode) {
            return m.reply('I could not find that post in the channel history. The post may be unavailable, or WhatsApp may not have returned it.')
        }

        const post = decodePost(postNode, metadata.id)
        if (!post?.message || !Object.keys(post.message).length) {
            return m.reply('That channel post did not include a forwardable message.')
        }

        await EliteProTech.sendMessage(m.chat, { forward: post, force: true }, { quoted: m })
    } catch (error) {
        console.error('[CHANNEL POST]', error)
        await m.reply(`Could not fetch that channel post: ${error?.message || error}`)
    }
}

handler.command = ['channelpost', 'getchannelpost', 'getpost']
handler.category = 'tools'

export default handler
