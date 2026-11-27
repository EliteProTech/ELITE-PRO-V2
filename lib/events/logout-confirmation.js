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

        const key = confirmationKey(m.chat, m.sender)
        const confirmations = global.replyConfirmations
        const pending = confirmations?.get(key)
        if (!pending) continue
        if (pending.expiresAt <= Date.now()) {
            confirmations.delete(key)
            continue
        }
        if (m.quoted?.id !== pending.messageId || m.text.trim().toLowerCase() !== 'confirm') continue

        confirmations.delete(key)
        const requirements = pending.requirements || {}
        if ((requirements.owner && !m.isOwner) ||
            (requirements.group && !m.isGroup) ||
            (requirements.admin && !m.isAdmin) ||
            (requirements.isBotAdmin && !m.isBotAdmin)) {
            await m.reply('You no longer have permission to perform that action.')
            continue
        }

        try {
            await pending.execute(m, EliteProTech)
        } catch (error) {
            await m.reply(`Confirmation failed: ${error.message || String(error)}`)
        }
    }
}

handler.on = 'messages.upsert'

export default handler
