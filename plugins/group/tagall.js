let handler = async (m, { EliteProTech, text }) => {
    if (!m.isGroup) {
        return await m.reply('This command can only be used in groups.')
    }

    if (!m.isAdmin && !m.isOwner) {
        return await m.reply('Only group admins can use this command.')
    }

    const metadata = await EliteProTech.groupMetadata(m.chat)
    const participants = metadata.participants || []

    if (participants.length === 0) {
        return await m.reply('No participants found in this group.')
    }

    const message = text?.trim()
        ? `*${text.trim()}*\n\n`
        : `*Tagging all members*\n\n`

    let body = message
    const mentions = []

    for (const p of participants) {
        const jid = EliteProTech.decodeJid(p.id)
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

export default handler
