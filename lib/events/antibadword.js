import { smsg } from '../myfunc.js'
import { getGroupSettings } from '../groupsettings.js'
import { enforceGroupRule, findBlockedWord } from '../groupmoderation.js'

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
        if (settings.antiBadWord === 'off') continue

        const matchedWord = findBlockedWord(m.text, settings.badWords)
        if (!matchedWord) continue

        await enforceGroupRule(EliteProTech, m, {
            mode: settings.antiBadWord,
            limit: settings.antiBadWordLimit,
            usersKey: 'antiBadWordUsers',
            label: 'bad word',
            detail: 'that word is not allowed here'
        })
    }
}

handler.on = 'messages.upsert'

export default handler
