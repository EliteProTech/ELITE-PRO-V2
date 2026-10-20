import { getGroupMetadata } from '../../lib/myfunc.js'
import { getGroupSettings, updateGroupSettings } from '../../lib/groupsettings.js'

const participantIds = participant => [participant?.id, participant?.lid, participant?.phoneNumber].filter(Boolean)

let handler = async (m, { EliteProTech, args }) => {
    const action = String(args[0] || '').toLowerCase()
    const settings = getGroupSettings(m.chat)
    const current = Array.isArray(settings.autoDeleteUsers) ? settings.autoDeleteUsers : []

    if (action === 'list') {
        return await m.reply(current.length
            ? `*Auto-delete targets*\n${current.map(jid => `• @${jid.split('@')[0]}`).join('\n')}`
            : 'No auto-delete targets are set for this group.')
    }
    if (action === 'clear' || (action === 'off' && args[1]?.toLowerCase() === 'all')) {
        updateGroupSettings(m.chat, { autoDeleteUsers: [] })
        return await m.reply('Auto-delete targets cleared for this group.')
    }
    if (!['on', 'add', 'off', 'remove', 'del'].includes(action)) {
        return await m.reply(
            `Usage:\n${global.prefix || '.'}antideleteuser on @user\n` +
            `${global.prefix || '.'}antideleteuser off @user\n` +
            `${global.prefix || '.'}antideleteuser list | clear`
        )
    }

    const requested = [...(m.mentionedJid || [])]
    if (m.quoted?.sender) requested.push(m.quoted.sender)
    for (const value of args.slice(1).flatMap(arg => String(arg).split(','))) {
        const number = value.replace(/\D/g, '')
        if (number.length >= 7 && number.length <= 15) requested.push(`${number}@s.whatsapp.net`)
    }
    if (!requested.length) return await m.reply('Mention or reply to a group member.')

    const metadata = await getGroupMetadata(EliteProTech, m.chat, true)
    const participants = metadata?.participants || []
    const targets = new Map()
    for (const target of requested) {
        const participant = participants.find(item => participantIds(item).includes(target))
        if (!participant) continue
        if (participant.admin === 'admin' || participant.admin === 'superadmin') continue
        const canonical = participant.id || participant.lid || participant.phoneNumber
        if (canonical) targets.set(canonical, participant)
    }
    if (!targets.size) return await m.reply('No matching non-admin group member was found.')

    const enabled = ['on', 'add'].includes(action)
    const next = new Set(current)
    for (const target of targets.keys()) {
        if (enabled) next.add(target)
        else next.delete(target)
    }
    if (next.size > 50) return await m.reply('This feature is limited to 50 targets per group.')

    updateGroupSettings(m.chat, { autoDeleteUsers: [...next] })
    return await m.reply(`Auto-delete ${enabled ? 'enabled' : 'disabled'} for ${targets.size} member${targets.size === 1 ? '' : 's'} in this group.`)
}

handler.command = ['antideleteuser', 'deleteuser']
handler.group = true
handler.admin = true
handler.isBotAdmin = true

export default handler
