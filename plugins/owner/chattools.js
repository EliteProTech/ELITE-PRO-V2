function quotedStarKey(m) {
    if (!m.quoted?.id) return null
    return {
        id: m.quoted.id,
        fromMe: Boolean(m.quoted.fromMe)
    }
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
            global.chatToolConfirmations ??= new Map()
            const now = Date.now()
            for (const [key, pending] of global.chatToolConfirmations) {
                if (pending.expiresAt <= now) global.chatToolConfirmations.delete(key)
            }

            const label = command === 'clearchat' ? 'clear this chat locally' : 'delete this chat locally'
            const sent = await EliteProTech.sendMessage(m.chat, {
                text: `⚠️ This will ${label} from your WhatsApp chat list. It will not delete messages for other people.\n\nReply to this message with *confirm* within 60 seconds to continue.`
            }, { quoted: m })

            const key = `${m.chat}:${m.sender}`
            global.chatToolConfirmations.delete(key)
            global.chatToolConfirmations.set(key, {
                action: command,
                chat: m.chat,
                messageId: sent.key.id,
                expiresAt: now + 60_000
            })
            while (global.chatToolConfirmations.size > 100) {
                global.chatToolConfirmations.delete(global.chatToolConfirmations.keys().next().value)
            }
            return
        }
    } catch (error) {
        await m.reply(`Unable to ${command}: ${error.message || String(error)}`)
    }
}

handler.command = ['clearchat', 'deletechat', 'pin', 'unpin', 'star', 'unstar']
handler.owner = true
handler.silentDeny = true

export default handler
