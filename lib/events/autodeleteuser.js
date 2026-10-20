import { smsg, getGroupMetadata } from '../myfunc.js'
import { getGroupSettings } from '../groupsettings.js'

const participantIds = participant => [participant?.id, participant?.lid, participant?.phoneNumber].filter(Boolean)

let handler = async (EliteProTech, { messages, type }) => {
    if (type !== 'notify') return

    for (const raw of messages || []) {
        if (!raw?.message || raw.key?.fromMe) continue

        let m
        try { m = await smsg(EliteProTech, raw) } catch { continue }
        if (!m?.isGroup || m.isAdmin || m.isOwner || !m.isBotAdmin) continue

        const targets = getGroupSettings(m.chat).autoDeleteUsers
        if (!Array.isArray(targets) || !targets.length) continue

        try {
            const metadata = await getGroupMetadata(EliteProTech, m.chat)
            const aliases = new Set([
                raw.key.participant,
                raw.key.participantAlt,
                m.sender
            ].filter(Boolean))
            const participant = (metadata?.participants || []).find(item =>
                participantIds(item).some(jid => aliases.has(jid))
            )
            if (!participant) continue
            const memberIds = participantIds(participant)
            if (!targets.some(jid => memberIds.includes(jid))) continue

            await EliteProTech.sendMessage(m.chat, { delete: raw.key })
        } catch {}
    }
}

handler.on = 'messages.upsert'

export default handler
