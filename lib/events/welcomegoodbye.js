import { getGroupMetadata } from '../myfunc.js'
import { formatGroupTemplate, getGroupSettings } from '../groupsettings.js'

let handler = async (EliteProTech, { id, participants, action }) => {
    if (!id || !['add', 'remove'].includes(action) || !participants?.length) return

    const settings = getGroupSettings(id)
    const enabled = action === 'add' ? settings.welcome : settings.goodbye
    if (!enabled) return

    const metadata = await getGroupMetadata(EliteProTech, id, true)
    const template = action === 'add' ? settings.welcomeMessage : settings.goodbyeMessage

    for (const jid of participants) {
        const text = formatGroupTemplate(template, {
            jid: EliteProTech.decodeJid(jid),
            group: metadata?.subject,
            count: metadata?.participants?.length
        })
        await EliteProTech.sendMessage(id, {
            text,
            mentions: [EliteProTech.decodeJid(jid)]
        }).catch(() => {})
    }
}

handler.on = 'group-participants.update'

export default handler
