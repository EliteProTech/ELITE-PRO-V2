import { getGroupMetadata } from '../../lib/myfunc.js'

function targetsFromMessage(m, args) {
    const targets = new Set([...(m.mentionedJid || [])])
    if (m.quoted?.sender) targets.add(m.quoted.sender)

    for (const value of args) {
        const number = value.replace(/\D/g, '')
        if (number) targets.add(`${number}@s.whatsapp.net`)
    }
    return [...targets]
}

function participantMatches(participant, jid) {
    return [participant.id, participant.lid, participant.phoneNumber]
        .filter(Boolean)
        .includes(jid)
}

async function getMentionTargets(EliteProTech, chat, targets) {
    const metadata = await getGroupMetadata(EliteProTech, chat, true)
    const resolved = []
    for (const target of targets) {
        const participant = metadata?.participants?.find(item => participantMatches(item, target))
        let jid = participant?.phoneNumber || target
        if (jid.endsWith('@lid')) {
            jid = await EliteProTech.resolveLidToJid(jid)
        }
        resolved.push({ jid: EliteProTech.decodeJid(jid), resolved: !jid.endsWith('@lid') })
    }
    return resolved
}

async function replySuccess(m, EliteProTech, action, targets, resolvedMentions) {
    const entries = resolvedMentions || await getMentionTargets(EliteProTech, m.chat, targets)
    const verb = action === 'add' ? 'has been added' : 'has been kicked'
    const lines = entries.map(entry =>
        entry.resolved ? `• @${entry.jid.split('@')[0]} ${verb}!` : `• A member ${verb}!`
    )
    await EliteProTech.sendMessage(m.chat, {
        text: lines.join('\n'),
        mentions: entries.map(entry => entry.jid)
    }, { quoted: m })
}

let handler = async (m, { EliteProTech, args, command }) => {
    const targets = targetsFromMessage(m, args)
    if (!targets.length) {
        return await m.reply(`Reply to a member, mention them, or provide their number.\n\nUsage: ${global.prefix || ''}${command} @user`)
    }

    const action = command === 'add' ? 'add' : 'remove'
    const mentions = await getMentionTargets(EliteProTech, m.chat, targets)
    try {
        const result = await EliteProTech.groupParticipantsUpdate(m.chat, targets, action)
        const failed = result.filter(item => item.status && item.status !== '200')
        if (!failed.length) return await replySuccess(m, EliteProTech, action, targets, mentions)
        throw new Error(`WhatsApp returned a non-success status for ${failed.length} member(s).`)
    } catch (error) {
        const metadata = await getGroupMetadata(EliteProTech, m.chat, true)
        const members = metadata?.participants || []
        const completed = action === 'remove'
            ? targets.every(target => !members.some(participant => participantMatches(participant, target)))
            : targets.every(target => members.some(participant => participantMatches(participant, target)))

        if (completed) {
            return await replySuccess(m, EliteProTech, action, targets, mentions)
        }
        await m.reply(`Unable to ${action} the member: ${error.message || String(error)}`)
    }
}

handler.command = ['add', 'kick']
handler.group = true
handler.admin = true
handler.isBotAdmin = true

export default handler
