let handler = async (m, { EliteProTech, text }) => {
    const match = String(text || '').match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/i)
    if (!match) {
        return await m.reply(`Send a valid WhatsApp group invite link.\n\nUsage: ${global.prefix || ''}joingc https://chat.whatsapp.com/INVITE_CODE`)
    }

    try {
        const groupJid = await EliteProTech.groupAcceptInvite(match[1])
        await m.reply(groupJid ? `Joined the group successfully.\n\nGroup: ${groupJid}` : 'WhatsApp did not return a group after joining.')
    } catch (error) {
        await m.reply(`Unable to join that group: ${error.message || String(error)}`)
    }
}

handler.command = ['joingc', 'join']
handler.owner = true
handler.silentDeny = true

export default handler
