import { runGroupActions } from '../../lib/groupactions.js'

function pendingJid(entry) {
    if (typeof entry === 'string') return entry
    if (!entry || typeof entry !== 'object') return null
    return entry.jid || entry.id || entry.phoneNumber || entry.lid ||
        Object.values(entry).find(value => typeof value === 'string' && value.includes('@')) || null
}

function sameUser(left, right) {
    if (!left || !right) return false
    return left === right || left.split('@')[0] === right.split('@')[0]
}

async function getPendingRequests(EliteProTech, chat) {
    const requests = await EliteProTech.groupRequestParticipantsList(chat)
    return (requests || []).map(pendingJid).filter(Boolean)
}

function selectedRequests(m, args, pending) {
    if (args[0]?.toLowerCase() === 'all') return pending

    const requested = [
        ...(m.mentionedJid || []),
        ...(m.quoted?.sender ? [m.quoted.sender] : []),
        ...args.flatMap(value => String(value).split(','))
            .map(value => value.replace(/\D/g, ''))
            .filter(Boolean)
            .map(number => `${number}@s.whatsapp.net`)
    ]

    return pending.filter(pendingJid => requested.some(target => sameUser(target, pendingJid)))
}

let handler = async (m, { EliteProTech, command, args }) => {
    if (command === 'joinapproval') {
        const mode = args[0]?.toLowerCase()
        if (!['on', 'off'].includes(mode)) {
            return await m.reply(`Usage: ${global.prefix || ''}joinapproval on | off`)
        }
        await EliteProTech.groupJoinApprovalMode(m.chat, mode)
        return await m.reply(`Join approval is now *${mode === 'on' ? 'ON' : 'OFF'}*.`)
    }

    let pending
    try {
        pending = await getPendingRequests(EliteProTech, m.chat)
    } catch (error) {
        return await m.reply(`Unable to load pending requests: ${error.message || String(error)}`)
    }

    if (command === 'pending' || command === 'pendingapprove') {
        if (!pending.length) return await m.reply('There are no pending join requests.')
        const visible = pending.slice(0, 50)
        const list = visible.map((jid, index) => `${index + 1}. @${jid.split('@')[0]}`).join('\n')
        const more = pending.length > visible.length ? `\n\n…and ${pending.length - visible.length} more.` : ''
        return await EliteProTech.sendMessage(m.chat, {
            text: `*Pending join requests (${pending.length})*\n\n${list}${more}\n\nUse ${global.prefix || ''}approve @user, ${global.prefix || ''}approve all, ${global.prefix || ''}reject @user, or ${global.prefix || ''}reject all.`,
            mentions: visible
        }, { quoted: m })
    }

    const targets = selectedRequests(m, args, pending)
    if (!targets.length) {
        return await m.reply(`No matching pending request found. Use ${global.prefix || ''}pending to see requests.`)
    }

    const action = command === 'approve' ? 'approve' : 'reject'
    if (args[0]?.toLowerCase() === 'all' && !args.some(arg => String(arg).toLowerCase() === 'confirm')) {
        return await m.reply(
            `This will ${action} *${targets.length}* pending requests one at a time with a safety delay.\n\n` +
            `Run *${global.prefix || ''}${command} all confirm* to continue.`
        )
    }
    await m.reply(`${action === 'approve' ? 'Approving' : 'Rejecting'} ${targets.length} request${targets.length === 1 ? '' : 's'} safely…`)

    const results = await runGroupActions(targets, action, async target => {
        const response = await EliteProTech.groupRequestParticipantsUpdate(m.chat, [target], action)
        const failed = response.find(item => item.status && item.status !== '200')
        if (failed) throw new Error(`WhatsApp returned status ${failed.status}.`)
        return response
    })

    const successful = results.filter(result => result.ok).map(result => result.target)
    const failed = results.length - successful.length
    const verb = action === 'approve' ? 'approved' : 'rejected'
    await EliteProTech.sendMessage(m.chat, {
        text: `*Join requests processed*\n\n${verb[0].toUpperCase()}${verb.slice(1)}: *${successful.length}*${failed ? `\nFailed: *${failed}*` : ''}`,
        mentions: successful
    }, { quoted: m })
}

handler.command = ['pending', 'pendingapprove', 'approve', 'reject', 'joinapproval']
handler.group = true
handler.admin = true
handler.isBotAdmin = true

export default handler
