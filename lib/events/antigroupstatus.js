import { smsg } from '../myfunc.js'
import { getGroupSettings, updateGroupSettings } from '../groupsettings.js'

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
        if (m.mtype !== 'groupStatusMentionMessage' && !raw.message.groupStatusMentionMessage) continue

        const settings = getGroupSettings(m.chat)
        const mode = settings.antiGroupStatus
        if (mode === 'off') continue

        if (m.isBotAdmin) {
            await EliteProTech.sendMessage(m.chat, { delete: m.key }).catch(() => {})
        }

        const users = { ...settings.antiGroupStatusUsers }
        const warnings = (users[m.sender] || 0) + 1
        users[m.sender] = warnings

        if (mode === 'delete') {
            await EliteProTech.sendMessage(m.chat, {
                text: `⚠️ @${m.sender.split('@')[0]}, status mentions are not allowed here.`,
                mentions: [m.sender]
            }).catch(() => {})
        }

        if (mode === 'warn' || mode === 'warnkick') {
            const kickNow = mode === 'warnkick' && warnings >= settings.antiGroupStatusLimit
            await EliteProTech.sendMessage(m.chat, {
                text: kickNow
                    ? `🚫 @${m.sender.split('@')[0]} reached the warning limit and will be removed.`
                    : `⚠️ Warning ${warnings}/${settings.antiGroupStatusLimit} for @${m.sender.split('@')[0]}. Status mentions are not allowed.`,
                mentions: [m.sender]
            }).catch(() => {})
        }

        const shouldKick = mode === 'kick' || (mode === 'warnkick' && warnings >= settings.antiGroupStatusLimit)
        if (shouldKick && m.isBotAdmin) {
            await EliteProTech.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {})
            delete users[m.sender]
        }

        updateGroupSettings(m.chat, { antiGroupStatusUsers: users })
    }
}

handler.on = 'messages.upsert'

export default handler
