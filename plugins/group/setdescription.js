let handler = async (m, { EliteProTech, text = '' }) => {
    const input = String(text).trim()
    if (!input) {
        return await m.reply(`Usage: ${global.prefix || '.'}setgroupdesc <description>\nUse *clear* to remove the current description.`)
    }

    const description = input.toLowerCase() === 'clear' ? '' : input
    if (description.length > 512) return await m.reply('The group description must be 512 characters or fewer.')

    try {
        await EliteProTech.groupUpdateDescription(m.chat, description)
        return await m.reply(description ? 'Group description updated.' : 'Group description cleared.')
    } catch (error) {
        return await m.reply(`Unable to update the group description: ${error.message || String(error)}`)
    }
}

handler.command = ['setgroupdesc', 'groupdesc', 'setgdesc']
handler.group = true
handler.admin = true
handler.ownerBypassAdmin = true
handler.isBotAdmin = true

export default handler
