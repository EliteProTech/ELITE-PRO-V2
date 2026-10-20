let handler = async (m, { EliteProTech, text = '' }) => {
    const name = String(text).trim()
    if (!name) return await m.reply(`Usage: ${global.prefix || '.'}setname <new WhatsApp account name>`)
    if (name.length > 25) return await m.reply('WhatsApp account names must be 25 characters or fewer.')

    try {
        await EliteProTech.updateProfileName(name)
        return await m.reply(`WhatsApp account name updated to *${name}*.`)
    } catch (error) {
        return await m.reply(`Unable to update the account name: ${error.message || String(error)}`)
    }
}

handler.command = ['setname', 'setaccountname']
handler.owner = true
handler.silentDeny = true

export default handler
