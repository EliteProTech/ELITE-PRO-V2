import { smsg } from '../myfunc.js'

const confirmationKey = (chat, sender) => `${chat}:${sender}`

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

        const confirmations = global.logoutConfirmations
        const key = confirmationKey(m.chat, m.sender)
        const pending = confirmations?.get(key)
        if (!pending) continue

        if (pending.expiresAt <= Date.now()) {
            confirmations.delete(key)
            continue
        }

        if (m.quoted?.id !== pending.messageId || m.text.trim().toLowerCase() !== 'confirm') continue

        confirmations.delete(key)
        try {
            await m.reply('Logging out...')
            await EliteProTech.logout()
        } catch (error) {
            await m.reply(`Logout failed: ${error.message || String(error)}`)
        }
    }
}

handler.on = 'messages.upsert'

export default handler
