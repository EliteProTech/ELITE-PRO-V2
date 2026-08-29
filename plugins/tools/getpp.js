let handler = async (m, { EliteProTech }) => {
    const target = m.quoted?.sender || m.mentionedJid?.[0] || (!m.isGroup ? m.chat : null)

    if (!target) {
        return await m.reply(`Reply to a person's message or mention them.\n\nUsage: ${global.prefix || ''}getpp @user`)
    }

    try {
        const image = await EliteProTech.profilePictureUrl(target, 'image')
        await EliteProTech.sendMessage(m.chat, {
            image: { url: image },
            caption: `Profile picture: @${target.split('@')[0]}`,
            mentions: [target]
        }, { quoted: m })
    } catch {
        await m.reply('That profile picture is unavailable. The person may have no picture or their privacy settings block it.')
    }
}

handler.command = ['getpp', 'pp']

export default handler
