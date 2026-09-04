import { smsg } from '../myfunc.js'
import { getGroupSettings } from '../groupsettings.js'

const groupInviteLink = /(?:https?:\/\/)?chat\.whatsapp\.com\/[a-zA-Z0-9]{10,}/i

let handler = async (EliteProTech, { messages, type }) => {
    if (type !== 'notify') return

    for (const raw of messages || []) {
        if (!raw?.message || raw.key?.fromMe) continue

        let m
        try {
            m = await smsg(EliteProTech, raw)
        } catch {
            continue
        }

        if (!m.isGroup || m.isAdmin) continue
        const settings = getGroupSettings(m.chat)
        if (settings.antiLink === 'off' || !groupInviteLink.test(m.text || '')) continue

        const mode = settings.antiLink
        const shouldDelete = mode.includes('delete')
        const shouldWarn = mode.includes('warn')
        const shouldKick = mode.includes('kick')

        if (shouldDelete && m.isBotAdmin) {
            await EliteProTech.sendMessage(m.chat, { delete: m.key }).catch(() => {})
        }

        if (shouldWarn) {
            await EliteProTech.sendMessage(m.chat, {
                text: `⚠️ @${m.sender.split('@')[0]}, group invite links are not allowed here.`,
                mentions: [m.sender]
            }).catch(() => {})
        }

        if (shouldKick && m.isBotAdmin) {
            await EliteProTech.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {})
        }
    }
}

handler.on = 'messages.upsert'

export default handler
