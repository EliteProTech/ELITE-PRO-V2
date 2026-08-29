import { getGroupMetadata } from '../../lib/myfunc.js'

let handler = async (m, { EliteProTech, text }) => {
    const metadata = await getGroupMetadata(EliteProTech, m.chat)
    const participants = metadata?.participants || []

    if (participants.length === 0) {
        return await m.reply('No participants found in this group.')
    }

    let customMessage = text?.trim() || ''
    if (!customMessage && m.quoted?.text) {
        customMessage = m.quoted.text
    }

    const header = customMessage
        ? `*${customMessage}*\n\n`
        : `*Tagging all members*\n\n`

    let body = header
    const mentions = []

    for (const p of participants) {
        const jid = p.phoneNumber || await EliteProTech.resolveLidToJid(p.id) || p.id
        mentions.push(jid)
        body += `➤ @${jid.split('@')[0]}\n`
    }

    body += `\n*Total:* ${participants.length} member(s)`

    await EliteProTech.sendMessage(m.chat, {
        text: body,
        mentions
    }, { quoted: m })
}

handler.command = ['tagall', 'everyone']
handler.group = true
handler.admin = true

export default handler
