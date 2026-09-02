import { getGroupMetadata } from '../../lib/myfunc.js'

async function targetsFromMessage(EliteProTech, m, args) {
    const metadata = await getGroupMetadata(EliteProTech, m.chat, true)
    const participants = metadata?.participants || []
    const targets = new Map()

    const addTarget = async target => {
        if (!target) return

        const participant = participants.find(item =>
            [item.id, item.lid, item.phoneNumber]
                .filter(Boolean)
                .some(value => value === target || value?.split('@')[0] === target.split('@')[0])
        )

        let jid = participant?.phoneNumber || participant?.id || target

        if (jid.endsWith('@lid')) {
            try {
                jid = await EliteProTech.resolveLidToJid(jid)
            } catch {}
        }

        jid = EliteProTech.decodeJid(jid)

        if (!jid) return

        const key = jid.split('@')[0]

        if (!targets.has(key)) {
            targets.set(key, jid)
        }
    }

    for (const jid of m.mentionedJid || []) {
        await addTarget(jid)
    }

    if (m.quoted?.sender) {
        await addTarget(m.quoted.sender)
    }

    for (const value of args) {
        const number = value.replace(/\D/g, '')
        if (number) {
            await addTarget(`${number}@s.whatsapp.net`)
        }
    }

    return [...targets.values()]
}

function participantMatches(participant, jid) {
    const values = [
        participant.id,
        participant.lid,
        participant.phoneNumber
    ].filter(Boolean)

    if (values.includes(jid)) return true

    const jidNumber = jid?.split('@')[0]

    if (!jidNumber) return false

    return values.some(value => value.split('@')[0] === jidNumber)
}

async function getMentionTargets(EliteProTech, chat, targets) {
    const metadata = await getGroupMetadata(EliteProTech, chat, true)
    const participants = metadata?.participants || []
    const resolved = []
    const seen = new Set()

    for (const target of targets) {
        const participant = participants.find(item =>
            participantMatches(item, target)
        )

        let jid = participant?.phoneNumber || participant?.id || target

        if (jid.endsWith('@lid')) {
            try {
                jid = await EliteProTech.resolveLidToJid(jid)
            } catch {}
        }

        jid = EliteProTech.decodeJid(jid)

        if (!jid) continue

        const key = jid.split('@')[0]

        if (seen.has(key)) continue

        seen.add(key)

        resolved.push({
            jid,
            resolved: true
        })
    }

    return resolved
}

async function replySuccess(m, EliteProTech, action, targets, resolvedMentions) {
    const entries = resolvedMentions || await getMentionTargets(
        EliteProTech,
        m.chat,
        targets
    )

    const messages = {
        add: 'has been added',
        remove: 'has been kicked',
        promote: 'has been promoted',
        demote: 'has been demoted'
    }

    const verb = messages[action] || 'has been updated'

    const lines = entries.length
        ? entries.map(entry =>
            `• @${entry.jid.split('@')[0]} ${verb}!`
        )
        : [`• A member ${verb}!`]

    await EliteProTech.sendMessage(
        m.chat,
        {
            text: lines.join('\n'),
            mentions: entries.map(entry => entry.jid)
        },
        { quoted: m }
    )
}

let handler = async (m, { EliteProTech, args, command }) => {
    const targets = await targetsFromMessage(EliteProTech, m, args)

    if (!targets.length) {
        return await m.reply(
            `Reply to a member, mention them, or provide their number.\n\nUsage: ${global.prefix || ''}${command} @user`
        )
    }

    const actionMap = {
        add: 'add',
        kick: 'remove',
        promote: 'promote',
        demote: 'demote'
    }

    const action = actionMap[command]

    if (!action) {
        return await m.reply('Invalid group participant action.')
    }

    const mentions = await getMentionTargets(
        EliteProTech,
        m.chat,
        targets
    )

    try {
        const result = await EliteProTech.groupParticipantsUpdate(
            m.chat,
            targets,
            action
        )

        const failed = result.filter(
            item => item.status && item.status !== '200'
        )

        if (!failed.length) {
            return await replySuccess(
                m,
                EliteProTech,
                action,
                targets,
                mentions
            )
        }

        throw new Error(
            `WhatsApp returned a non-success status for ${failed.length} member(s).`
        )
    } catch (error) {
        const metadata = await getGroupMetadata(
            EliteProTech,
            m.chat,
            true
        )

        const members = metadata?.participants || []

        let completed = false

        if (action === 'remove') {
            completed = targets.every(
                target =>
                    !members.some(participant =>
                        participantMatches(participant, target)
                    )
            )
        } else if (action === 'add') {
            completed = targets.every(
                target =>
                    members.some(participant =>
                        participantMatches(participant, target)
                    )
            )
        } else if (action === 'promote') {
            completed = targets.every(
                target => {
                    const participant = members.find(item =>
                        participantMatches(item, target)
                    )
                    return participant?.admin === 'admin' ||
                        participant?.admin === 'superadmin'
                }
            )
        } else if (action === 'demote') {
            completed = targets.every(
                target => {
                    const participant = members.find(item =>
                        participantMatches(item, target)
                    )
                    return participant && !participant.admin
                }
            )
        }

        if (completed) {
            return await replySuccess(
                m,
                EliteProTech,
                action,
                targets,
                mentions
            )
        }

        await m.reply(
            `Unable to ${command} the member: ${error.message || String(error)}`
        )
    }
}

handler.command = ['add', 'kick', 'promote', 'demote']
handler.group = true
handler.admin = true
handler.isBotAdmin = true

export default handler
