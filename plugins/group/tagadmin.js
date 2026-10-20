import { getGroupMetadata } from '../../lib/myfunc.js'

let handler = async (m, { EliteProTech, text = '' }) => {
    try {
        const metadata = await getGroupMetadata(EliteProTech, m.chat, true)
        const admins = (metadata?.participants || []).filter(participant =>
            participant.admin === 'admin' || participant.admin === 'superadmin'
        )
        if (!admins.length) return await m.reply('This group has no admins to tag.')

        const mentions = [...new Set(admins.map(participant =>
            participant.id || participant.lid || participant.phoneNumber
        ).filter(Boolean))]
        const title = String(text).trim()
        return await EliteProTech.sendMessage(m.chat, {
            text: `${title ? `*${title}*\n\n` : ''}${mentions.map(jid => `• @${jid.split('@')[0]}`).join('\n')}`,
            mentions
        }, { quoted: m })
    } catch (error) {
        return await m.reply(`Could not get the group admins: ${error.message || String(error)}`)
    }
}

handler.command = ['tagadmin', 'tagadmins', 'admins']
handler.group = true

export default handler
