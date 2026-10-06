const DEFAULT_PROFILE_PICTURE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'

function formatUpdatedAt(value) {
    if (!value) return ''
    const numeric = Number(value)
    const date = new Date(Number.isFinite(numeric) && numeric > 0
        ? (numeric < 1e12 ? numeric * 1000 : numeric)
        : value)
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString()
}

async function resolveTarget(m, EliteProTech, text) {
    let target = m.sender

    if (m.quoted?.sender) {
        target = m.quoted.sender
    } else if (m.mentionedJid?.length) {
        target = m.mentionedJid[0]
    } else if (text?.trim()) {
        const number = String(text).replace(/\D/g, '')
        if (!number) throw new Error('Provide a valid number.')
        target = `${number}@s.whatsapp.net`
    }

    if (target.endsWith('@lid')) {
        target = await EliteProTech.resolveLidToJid(target)
    }

    return EliteProTech.decodeJid(target)
}

function mentionedDisplayName(m, text) {
    if (m.quoted?.sender) return ''
    const value = String(text || '')
    const match = value.match(/@([^\s@]+)/)
    return match?.[1] || ''
}

let handler = async (m, { EliteProTech, text }) => {
    try {
        const target = await resolveTarget(m, EliteProTech, text)
        if (!target) return await m.reply('Unable to determine the profile target.')
        const isLid = target.endsWith('@lid')
        const displayName = mentionedDisplayName(m, text)

        let picture = DEFAULT_PROFILE_PICTURE
        try {
            picture = await EliteProTech.profilePictureUrl(target, 'image') || DEFAULT_PROFILE_PICTURE
        } catch {}

        let about = 'No status available'
        let updatedAt = ''
        try {
            const statuses = await EliteProTech.fetchStatus(target)
            const status = statuses?.[0]?.status
            if (status?.status) {
                about = status.status
                updatedAt = formatUpdatedAt(status.setAt)
            }
        } catch {}

        let business = ''
        let accountType = 'Personal account'
        try {
            const profile = await EliteProTech.getBusinessProfile(target)
            if (profile) {
                accountType = 'Business account'
                const hours = profile.business_hours?.business_config
                    ?.map(day => `• ${String(day.day_of_week || 'Unknown').replace(/(^|_)(\w)/g, (_, space, letter) => `${space ? ' ' : ''}${letter.toUpperCase()}`)}: ${String(day.mode || 'N/A').replaceAll('_', ' ')}`)
                    .join('\n') || 'N/A'
                business = `\n\n*Business Profile*\n• WhatsApp ID: ${profile.wid || 'N/A'}\n• Category: ${profile.category || 'N/A'}\n• Description: ${profile.description || 'N/A'}\n• Website: ${profile.website?.join(', ') || 'N/A'}\n• Email: ${profile.email || 'N/A'}\n• Address: ${profile.address || 'N/A'}\n• Timezone: ${profile.business_hours?.timezone || 'N/A'}\n• Business Hours:\n${hours}`
            }
        } catch {}

        const userLabel = isLid
            ? `@${displayName || 'user'}`
            : `@${target.split('@')[0]}`

        await EliteProTech.sendMessage(m.chat, {
            image: { url: picture },
            caption: `*User Profile*\n• User: ${userLabel}\n• Account: ${accountType}\n• About: ${about}${updatedAt ? `\n• Last Updated: ${updatedAt}` : ''}${business}`,
            mentions: isLid ? [] : [target]
        }, { quoted: m })
    } catch (error) {
        await m.reply(`Unable to get that profile: ${error.message || String(error)}`)
    }
}

handler.command = ['profile', 'userinfo']

export default handler
