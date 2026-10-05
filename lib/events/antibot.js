import { smsg } from '../myfunc.js'
import { getGroupSettings } from '../groupsettings.js'
import { enforceGroupRule, isBotCommand } from '../groupmoderation.js'

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
        if (settings.antiBot === 'off' || !isBotCommand(m.text)) continue

        await enforceGroupRule(EliteProTech, m, {
            mode: settings.antiBot,
            limit: settings.antiBotLimit,
            usersKey: 'antiBotUsers',
            label: 'bot command',
            detail: 'bot commands are not allowed here'
        })
    }
}

handler.on = 'messages.upsert'

export default handler
