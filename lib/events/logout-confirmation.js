import { smsg } from '../myfunc.js'

const confirmationKey = (chat, sender) => `${chat}:${sender}`

const lastMessage = m => [{
    key: {
        remoteJid: m.chat,
        fromMe: Boolean(m.key?.fromMe),
        id: m.key?.id,
        participant: m.key?.participant || undefined
    },
    messageTimestamp: m.messageTimestamp || Math.floor(Date.now() / 1000)
}]

let handler = async (EliteProTech, { messages, type }) => {
    if (type !== 'notify' && type !== 'append') return

    for (const raw of messages || []) {
        if (!raw?.message || raw.key?.remoteJid === 'status@broadcast') continue

        let m
        try {
            m = await smsg(EliteProTech, raw)
        } catch {
            continue
        }

        const key = confirmationKey(m.chat, m.sender)
        const logoutConfirmations = global.logoutConfirmations
        const logoutPending = logoutConfirmations?.get(key)
        if (logoutPending) {
            if (logoutPending.expiresAt <= Date.now()) {
                logoutConfirmations.delete(key)
            } else if (m.quoted?.id === logoutPending.messageId && m.text.trim().toLowerCase() === 'confirm') {
                logoutConfirmations.delete(key)
                try {
                    await m.reply('Logging out...')
                    await EliteProTech.logout()
                } catch (error) {
                    await m.reply(`Logout failed: ${error.message || String(error)}`)
                }
                continue
            }
        }

        const chatConfirmations = global.chatToolConfirmations
        const chatPending = chatConfirmations?.get(key)
        if (!chatPending) continue
        if (chatPending.expiresAt <= Date.now()) {
            chatConfirmations.delete(key)
            continue
        }
        if (m.quoted?.id !== chatPending.messageId || m.text.trim().toLowerCase() !== 'confirm') continue

        chatConfirmations.delete(key)
        try {
            const change = chatPending.action === 'clearchat'
                ? { clear: true, lastMessages: lastMessage(m) }
                : { delete: true, lastMessages: lastMessage(m) }
            await EliteProTech.chatModify(change, chatPending.chat)
        } catch (error) {
            await m.reply(`Unable to ${chatPending.action}: ${error.message || String(error)}`)
        }
    }
}

handler.on = 'messages.upsert'

export default handler
