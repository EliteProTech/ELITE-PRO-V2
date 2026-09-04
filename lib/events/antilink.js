import { smsg } from '../myfunc.js'
import { getGroupSettings, updateGroupSettings } from '../groupsettings.js'

const anyLink = /(?:https?:\/\/|www\.)[^\s<>()]+/i

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

        if (!m.isGroup || m.isAdmin || m.isOwner) continue
        const settings = getGroupSettings(m.chat)
        if (settings.antiLink === 'off' || !anyLink.test(m.text || '')) continue

        const mode = settings.antiLink
        const shouldDelete = mode.includes('delete')
        const shouldWarn = mode.includes('warn')
        const shouldKick = mode.includes('kick')

        if (shouldDelete && m.isBotAdmin) {
            await EliteProTech.sendMessage(m.chat, { delete: m.key }).catch(() => {})
        }

        let warnings = 0
        if (shouldWarn) {
            const users = { ...settings.antiLinkUsers }
            warnings = (users[m.sender] || 0) + 1
            users[m.sender] = warnings
            updateGroupSettings(m.chat, { antiLinkUsers: users })
            await EliteProTech.sendMessage(m.chat, {
                text: `⚠️ @${m.sender.split('@')[0]}, links are not allowed here.${mode.includes('kick') ? ` Warning ${warnings}/${settings.antiLinkLimit}.` : ''}`,
                mentions: [m.sender]
            }).catch(() => {})
        }

        const canKick = shouldKick && (!shouldWarn || warnings >= settings.antiLinkLimit)
        if (canKick && m.isBotAdmin) {
            await EliteProTech.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {})
            const users = { ...getGroupSettings(m.chat).antiLinkUsers }
            delete users[m.sender]
            updateGroupSettings(m.chat, { antiLinkUsers: users })
        }
    }
}

handler.on = 'messages.upsert'

export default handler
