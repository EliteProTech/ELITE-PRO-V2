import { requestReplyConfirmation } from '../../lib/confirmations.js'

function quotedStarKey(m) {
    if (!m.quoted?.id) return null
    return {
        id: m.quoted.id,
        fromMe: Boolean(m.quoted.fromMe)
    }
}

function lastMessage(m) {
    return [{
        key: {
            remoteJid: m.chat,
            fromMe: Boolean(m.key?.fromMe),
            id: m.key?.id,
            participant: m.key?.participant || undefined
        },
        messageTimestamp: m.messageTimestamp || Math.floor(Date.now() / 1000)
    }]
}

let handler = async (m, { EliteProTech, command }) => {
    try {
        if (command === 'pin' || command === 'unpin') {
            await EliteProTech.chatModify({ pin: command === 'pin' }, m.chat)
            return await m.reply(`Chat ${command === 'pin' ? 'pinned' : 'unpinned'}.`)
        }

        if (command === 'star' || command === 'unstar') {
            const key = quotedStarKey(m)
            if (!key) return await m.reply(`Reply to a message first.\n\nUsage: ${global.prefix || ''}${command}`)
            await EliteProTech.star(m.chat, [key], command === 'star')
            return await m.reply(`Message ${command === 'star' ? 'starred' : 'unstarred'}.`)
        }

        if (command === 'clearchat' || command === 'deletechat') {
            const label = command === 'clearchat' ? 'clear this chat locally' : 'delete this chat locally'
            await requestReplyConfirmation(EliteProTech, m, {
                text: `⚠️ This will ${label} from your WhatsApp chat list. It will not delete messages for other people.\n\nReply to this message with *confirm* within 60 seconds to continue.`,
                requirements: { owner: true },
                execute: async (confirmation, socket) => {
                    const change = command === 'clearchat'
                        ? { clear: true, lastMessages: lastMessage(confirmation) }
                        : { delete: true, lastMessages: lastMessage(confirmation) }
                    await socket.chatModify(change, m.chat)
                }
            })
        }
    } catch (error) {
        await m.reply(`Unable to ${command}: ${error.message || String(error)}`)
    }
}

handler.command = ['clearchat', 'deletechat', 'pin', 'unpin', 'star', 'unstar']
handler.owner = true
handler.silentDeny = true

export default handler
