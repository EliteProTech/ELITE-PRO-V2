import { getGroupMetadata } from '../../lib/myfunc.js'
import { runGroupActions } from '../../lib/groupactions.js'

function participantJid(participant) {
    return participant?.phoneNumber || participant?.id || participant?.lid || null
}

function sameUser(left, right) {
    if (!left || !right) return false
    return left === right || left.split('@')[0] === right.split('@')[0]
}

function selectTargets(command, participants, botJid) {
    return participants
        .filter(participant => {
            const jid = participantJid(participant)
            if (!jid || sameUser(jid, botJid)) return false

            if (command === 'promoteall') return !participant.admin
            if (command === 'demoteall') return participant.admin === 'admin'
            return !participant.admin
        })
        .map(participantJid)
        .filter(Boolean)
}

let handler = async (m, { EliteProTech, command, args }) => {
    const metadata = await getGroupMetadata(EliteProTech, m.chat, true)
    const botJid = EliteProTech.decodeJid(EliteProTech.user.id)
    const targets = selectTargets(command, metadata?.participants || [], botJid)

    if (!targets.length) {
        return await m.reply('There are no eligible members for that bulk action.')
    }

    const labels = {
        promoteall: ['promote', 'promoted'],
        demoteall: ['demote', 'demoted'],
        kickall: ['remove', 'removed']
    }
    const [action, pastTense] = labels[command]

    if (args[0]?.toLowerCase() !== 'confirm') {
        const protectedMembers = command === 'kickall'
            ? 'Admins and the bot are protected.'
            : 'The bot and group creator are protected.'
        return await m.reply(
            `This will ${action} *${targets.length}* member${targets.length === 1 ? '' : 's'}, one at a time with a safety delay. ${protectedMembers}\n\n` +
            `Run *${global.prefix || ''}${command} confirm* to continue.`
        )
    }

    await m.reply(`Starting bulk ${action}. Processing ${targets.length} member${targets.length === 1 ? '' : 's'} safely…`)

    const results = await runGroupActions(targets, action, async target => {
        const response = await EliteProTech.groupParticipantsUpdate(m.chat, [target], action)
        const failed = response.find(item => item.status && item.status !== '200')
        if (failed) throw new Error(`WhatsApp returned status ${failed.status}.`)
        return response
    })

    const successful = results.filter(result => result.ok).length
    const failed = results.length - successful
    await m.reply(`Bulk action complete. *${successful}* member${successful === 1 ? '' : 's'} ${pastTense}.${failed ? ` Failed: *${failed}*.` : ''}`)
}

handler.command = ['promoteall', 'demoteall', 'kickall']
handler.group = true
handler.admin = true
handler.isBotAdmin = true

export default handler
