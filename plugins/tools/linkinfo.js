import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

function findWhatsAppLink(text = '') {
    const match = String(text).match(/(?:https?:\/\/)?(?:www\.)?(?:whatsapp\.com\/channel\/|chat\.whatsapp\.com\/)[^\s<>]+/i)
    return match?.[0]?.replace(/[),.;!?\]}]+$/g, '') || ''
}

function parseInviteLink(input, type) {
    let url
    try {
        url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
    } catch {
        return null
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (type === 'channel' && host === 'whatsapp.com') {
        const match = url.pathname.match(/^\/channel\/([A-Za-z0-9_-]+)\/?$/)
        return match ? { code: match[1], link: url.toString() } : null
    }
    if (type === 'group' && host === 'chat.whatsapp.com') {
        const match = url.pathname.match(/^\/([A-Za-z0-9_-]+)\/?$/)
        return match ? { code: match[1], link: url.toString() } : null
    }
    return null
}

async function sendCopyMessage(EliteProTech, m, content) {
    const message = generateWAMessageFromContent(
        m.chat,
        {
            interactiveMessage: {
                body: { text: content.text },
                footer: { text: 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʟɪᴛᴇ-ᴘʀᴏ-ᴛᴇᴄʜ©' },
                nativeFlowMessage: {
                    buttons: [{
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: content.buttonLabel,
                            copy_code: content.copyValue
                        })
                    }],
                    messageParamsJson: ''
                },
                contextInfo: { pairedMediaType: 0 }
            }
        },
        { userJid: EliteProTech.user.id, quoted: m }
    )

    await EliteProTech.relayMessage(m.chat, message.message, {
        messageId: message.key.id,
        additionalNodes: [{
            tag: 'biz',
            attrs: {},
            content: [{
                tag: 'interactive',
                attrs: { type: 'native_flow', v: '1' },
                content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
            }]
        }]
    })
}

let handler = async (m, { EliteProTech, command, text = '' }) => {
    const type = command.toLowerCase().includes('channel') ? 'channel' : 'group'
    const rawLink = findWhatsAppLink(text) || findWhatsAppLink(m.quoted?.text || m.quoted?.caption || '')
    if (!rawLink) {
        const prefix = global.prefix || '.'
        return await m.reply(`Provide a WhatsApp ${type} invite link.\nExample: ${prefix}${type === 'channel' ? 'channelid' : 'groupid'} <link>`)
    }

    const invite = parseInviteLink(rawLink, type)
    if (!invite) return await m.reply(`That doesn't look like a valid WhatsApp ${type} invite link.`)

    try {
        if (type === 'channel') {
            const result = await EliteProTech.newsletterMetadata('invite', invite.code)
            if (!result?.id) throw new Error('No channel ID was returned.')

            await sendCopyMessage(EliteProTech, m, {
                text: `📢 *WhatsApp Channel Info*\n\n📌 *Channel Code:*\n${invite.code}\n\n🆔 *Channel ID:*\n${result.id}\n\n🔗 *Link:*\n${invite.link}`,
                buttonLabel: 'Copy Channel ID 📋',
                copyValue: result.id
            })
        } else {
            const result = await EliteProTech.groupGetInviteInfo(invite.code)
            if (!result?.id) throw new Error('No group ID was returned.')

            await sendCopyMessage(EliteProTech, m, {
                text: `👥 *WhatsApp Group Info*\n\n📝 *Group Name:*\n${result.subject || 'Unknown'}\n\n📌 *Invite Code:*\n${invite.code}\n\n🆔 *Group ID:*\n${result.id}\n\n🔗 *Link:*\n${invite.link}`,
                buttonLabel: 'Copy Group ID 📋',
                copyValue: result.id
            })
        }
    } catch {
        const message = type === 'channel'
            ? '❌ Failed to resolve the channel ID. Check that the channel link is valid.'
            : '❌ Failed to resolve the group ID. The invite may be invalid or revoked.'
        await m.reply(message)
    }
}

handler.command = ['channelid', 'channel-id', 'groupid', 'group-id']

export default handler
