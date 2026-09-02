let handler = async (m, { EliteProTech }) => {
    if (!m.isGroup) return m.reply('This command can only be used in groups.')
    await EliteProTech.groupLeave(m.chat)
}

handler.command = ['left', 'leavegroup']
handler.group = true
handler.admin = true
handler.isBotAdmin = true

export default handler
