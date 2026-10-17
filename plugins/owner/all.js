import { getGroupMetadata } from '../../lib/myfunc.js'

let handler = async (m, { EliteProTech, text = '' }) => {
    if (!m.isGroup) return await m.reply('This command only works in a group.')
    if (!m.isOwner) return await m.reply('This command is for the bot owner only.')

    const metadata = await getGroupMetadata(EliteProTech, m.chat, true)
    const participants = metadata?.participants || []
    if (!participants.length) return await m.reply('Could not load this group’s participants.')

    const mentionedJid = [...new Set(participants.map(participant => participant.id).filter(Boolean))]
    const subject = String(text || '').trim() || 'Hello everyone 👋'

    return await EliteProTech.sendMessage(m.chat, {
        text: `@${m.chat}`,
        contextInfo: {
            mentionedJid,
            groupMentions: [{ groupJid: m.chat, groupSubject: subject }]
        }
    }, { quoted: m })
}

handler.command = ['all']
handler.group = true
handler.owner = true

export default handler
