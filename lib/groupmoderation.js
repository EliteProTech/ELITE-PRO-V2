import { getGroupSettings, updateGroupSettings } from './groupsettings.js'

export function isBotCommand(text) {
    return /^(?:[.!/#-])[a-z][a-z0-9_-]{1,}(?:\s|$)/i.test(String(text || '').trim())
}

export function findBlockedWord(text, words) {
    const value = String(text || '').toLowerCase()
    for (const word of words || []) {
        const phrase = String(word).trim().toLowerCase()
        if (!phrase) continue

        if (phrase.includes(' ')) {
            if (value.includes(phrase)) return phrase
            continue
        }

        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        if (new RegExp(`(?:^|\\b)${escaped}(?=\\b|$)`, 'i').test(value)) return phrase
    }
    return null
}

export async function enforceGroupRule(EliteProTech, m, {
    mode,
    limit,
    usersKey,
    label,
    detail
}) {
    if (!mode || mode === 'off') return false

    const shouldDelete = mode.includes('delete')
    const shouldWarn = mode.includes('warn')
    const shouldKick = mode.includes('kick')

    if (shouldDelete && m.isBotAdmin) {
        await EliteProTech.sendMessage(m.chat, { delete: m.key }).catch(() => {})
    }

    const settings = getGroupSettings(m.chat)
    const users = { ...(settings[usersKey] || {}) }
    let warnings = users[m.sender] || 0

    if (shouldWarn) {
        warnings += 1
        users[m.sender] = warnings
        updateGroupSettings(m.chat, { [usersKey]: users })
        const warningText = shouldKick
            ? ` Warning ${warnings}/${limit}.`
            : ''
        await EliteProTech.sendMessage(m.chat, {
            text: `⚠️ @${m.sender.split('@')[0]}, ${detail}.${warningText}`,
            mentions: [m.sender]
        }, { quoted: m }).catch(() => {})
    }

    const kickNow = shouldKick && (!shouldWarn || warnings >= limit)
    if (kickNow && m.isBotAdmin) {
        await EliteProTech.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {})
        delete users[m.sender]
        updateGroupSettings(m.chat, { [usersKey]: users })
    }

    return true
}
