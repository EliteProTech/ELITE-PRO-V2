import { getGroupMetadata } from '../myfunc.js'
import { getGroupSettings } from '../groupsettings.js'

async function sendGroupEvent(EliteProTech, groupId, text) {
    if (!groupId || !getGroupSettings(groupId).antiGroupEvents) return

    const metadata = await getGroupMetadata(EliteProTech, groupId, true).catch(() => null)
    const destination = metadata?.announce
        ? EliteProTech.decodeJid(EliteProTech.user.id)
        : groupId
    const heading = metadata?.announce
        ? `*Group event — ${metadata?.subject || groupId}*\n\nThe group is locked, so this notice was sent here.\n\n`
        : '*Group event*\n\n'

    await EliteProTech.sendMessage(destination, { text: `${heading}${text}` }).catch(() => {})
}

function participantLabel(participant) {
    const jid = typeof participant === 'string'
        ? participant
        : participant?.phoneNumber || participant?.id || participant?.lid
    return jid ? `@${jid.split('@')[0]}` : 'A member'
}

let handler = async (EliteProTech, update) => {
    if (Array.isArray(update)) {
        for (const group of update) {
            const id = group?.id
            if (!id) continue

            const changes = []
            if (group.subject) changes.push(`Group name changed to *${group.subject}*.`)
            if (Object.hasOwn(group, 'desc')) changes.push('Group description was updated.')
            if (Object.hasOwn(group, 'announce')) changes.push(group.announce ? 'Only admins can now send messages.' : 'All members can now send messages.')
            if (Object.hasOwn(group, 'restrict')) changes.push(group.restrict ? 'Only admins can now edit group info.' : 'Members can now edit group info.')
            if (Object.hasOwn(group, 'memberAddMode')) changes.push(group.memberAddMode === 'admin_add' ? 'Only admins can now add members.' : 'Members can now add members.')
            if (Object.hasOwn(group, 'ephemeralDuration')) changes.push('Disappearing-message settings were updated.')
            if (Object.hasOwn(group, 'picture')) changes.push('Group picture was updated.')
            if (changes.length) await sendGroupEvent(EliteProTech, id, changes.join('\n'))
        }
        return
    }

    const { id, participants, action } = update || {}
    if (!id || !participants?.length) return

    const names = participants.map(participantLabel).join(', ')
    const actionText = {
        add: 'joined the group.',
        remove: 'was removed from the group.',
        leave: 'left the group.',
        promote: 'was promoted to admin.',
        demote: 'was demoted from admin.'
    }[action]
    if (!actionText) return

    await sendGroupEvent(EliteProTech, id, `${names} ${actionText}`)
}

handler.on = ['groups.update', 'group-participants.update']

export default handler
