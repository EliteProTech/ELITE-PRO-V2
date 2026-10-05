const DEFAULT_PROFILE_PICTURE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'

async function resolveTarget(m, EliteProTech, text) {
    let target = m.quoted?.sender || m.mentionedJid?.[0] || m.sender
    const number = String(text || '').replace(/\D/g, '')
    if (text?.trim() && !number) throw new Error('Provide a valid number.')
    if (number) target = `${number}@s.whatsapp.net`
    if (target?.endsWith('@lid')) target = await EliteProTech.resolveLidToJid(target)
    return EliteProTech.decodeJid(target)
}

let handler = async (m, { EliteProTech, text }) => {
    try {
        const target = await resolveTarget(m, EliteProTech, text)
        if (!target) return await m.reply('Unable to determine the profile target.')

        let picture = DEFAULT_PROFILE_PICTURE
        try {
            picture = await EliteProTech.profilePictureUrl(target, 'image') || DEFAULT_PROFILE_PICTURE
        } catch {}

        let about = 'No status available'
        try {
            const statuses = await EliteProTech.fetchStatus(target)
            const status = statuses?.[0]?.status
            if (status?.status) about = status.status
        } catch {}

        let business = ''
        try {
            const profile = await EliteProTech.getBusinessProfile(target)
            if (profile) {
                business = `\n\n*Business Profile*\n• Category: ${profile.category || 'N/A'}\n• Description: ${profile.description || 'N/A'}\n• Website: ${profile.website?.join(', ') || 'N/A'}\n• Email: ${profile.email || 'N/A'}\n• Address: ${profile.address || 'N/A'}`
            }
        } catch {}

        await EliteProTech.sendMessage(m.chat, {
            image: { url: picture },
            caption: `*User Profile*\n• Number: @${target.split('@')[0]}\n• About: ${about}${business}`,
            mentions: [target]
        }, { quoted: m })
    } catch (error) {
        await m.reply(`Unable to get that profile: ${error.message || String(error)}`)
    }
}

handler.command = ['profile', 'userinfo']

export default handler
