let handler = async (m, { EliteProTech, command }) => {
    const closed = command === 'close'
    try {
        await EliteProTech.groupSettingUpdate(m.chat, closed ? 'announcement' : 'not_announcement')
        await m.reply(`Group is now *${closed ? 'closed' : 'open'}*.`)
    } catch (error) {
        await m.reply(`Unable to update group settings: ${error.message || String(error)}`)
    }
}

handler.command = ['open', 'close']
handler.group = true
handler.admin = true
handler.isBotAdmin = true

export default handler
