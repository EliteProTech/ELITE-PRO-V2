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

function quotedStarKey(m) {
    if (!m.quoted?.id) return null
    return {
        id: m.quoted.id,
        fromMe: Boolean(m.quoted.fromMe)
    }
}

let handler = async (m, { EliteProTech, command, args }) => {
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
            if (args[0]?.toLowerCase() !== 'confirm') {
                const label = command === 'clearchat' ? 'clear this chat locally' : 'delete this chat locally'
                return await m.reply(`This will ${label} from your WhatsApp chat list. It will not delete messages for other people.\n\nRun *${global.prefix || ''}${command} confirm* to continue.`)
            }
            await EliteProTech.chatModify(
                command === 'clearchat'
                    ? { clear: true, lastMessages: lastMessage(m) }
                    : { delete: true, lastMessages: lastMessage(m) },
                m.chat
            )
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
