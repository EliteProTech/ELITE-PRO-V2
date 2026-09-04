import { getGroupMetadata } from '../myfunc.js'
import { formatGroupTemplate, getGroupSettings } from '../groupsettings.js'

let handler = async (EliteProTech, { id, participants, action }) => {
    if (!id || !['add', 'remove'].includes(action) || !participants?.length) return

    const settings = getGroupSettings(id)
    const enabled = action === 'add' ? settings.welcome : settings.goodbye
    if (!enabled) return

    const metadata = await getGroupMetadata(EliteProTech, id, true)
    const template = action === 'add' ? settings.welcomeMessage : settings.goodbyeMessage
    let groupPicture = null
    try {
        groupPicture = await EliteProTech.profilePictureUrl(id, 'image')
    } catch {}

    for (const participant of participants) {
        const rawJid = typeof participant === 'string'
            ? participant
            : participant?.phoneNumber || participant?.id || participant?.lid
        if (!rawJid) continue

        const jid = EliteProTech.decodeJid(rawJid)
        const text = formatGroupTemplate(template, {
            jid,
            group: metadata?.subject,
            count: metadata?.participants?.length
        })
        const content = groupPicture
            ? { image: { url: groupPicture }, caption: text, mentions: [jid] }
            : { text, mentions: [jid] }
        await EliteProTech.sendMessage(id, content).catch(() => {})
    }
}

handler.on = 'group-participants.update'

export default handler
