const MAX_IMAGE_BYTES = 10 * 1024 * 1024

let handler = async (m, { EliteProTech }) => {
    const image = m.quoted?.mtype === 'imageMessage'
        ? m.quoted
        : m.mtype === 'imageMessage' ? m : null
    if (!image) return await m.reply('Reply to an image or send an image with .setgrouppp as its caption.')

    try {
        const buffer = await image.download()
        if (!buffer?.length) return await m.reply('Could not download the image.')
        if (buffer.length > MAX_IMAGE_BYTES) return await m.reply('The image is too large. Maximum size is 10 MB.')
        await EliteProTech.updateProfilePicture(m.chat, buffer)
        return await m.reply('Group picture updated.')
    } catch (error) {
        return await m.reply(`Could not update the group picture: ${error.message || String(error)}`)
    }
}

handler.command = ['setgrouppp', 'setgrouppic', 'groupdp']
handler.group = true
handler.admin = true
handler.isBotAdmin = true

export default handler
