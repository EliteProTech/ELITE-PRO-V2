const splitNameDescription = input => {
    const separator = input.indexOf('|')
    return separator === -1
        ? { name: input.trim(), description: '' }
        : { name: input.slice(0, separator).trim(), description: input.slice(separator + 1).trim() }
}

const normalizePhone = value => {
    const digits = String(value).replace(/\D/g, '')
    return digits.length >= 7 && digits.length <= 15 ? `${digits}@s.whatsapp.net` : null
}

const getInviteLink = (base, code) => code ? `${base}${code}` : null

let handler = async (m, { EliteProTech, command, text = '' }) => {
    const action = String(command).toLowerCase()
    const input = String(text).trim()
    const { name, description } = splitNameDescription(input)
    if (!name) {
        const usage = action === 'creategroup'
            ? `${global.prefix || '.'}creategroup <name> | @mention [phone number]`
            : `${global.prefix || '.'}${action} <name> | <description>`
        return await m.reply(`Usage: ${usage}`)
    }
    if (name.length > 100) return await m.reply('Keep the name under 100 characters.')
    if (description.length > 1024) return await m.reply('Keep the description under 1,024 characters.')

    try {
        if (action === 'creategroup') {
            const participantText = input.includes('|') ? input.slice(input.indexOf('|') + 1) : ''
            const phoneJids = [...participantText.matchAll(/\+?\d[\d\s()-]{5,18}\d/g)]
                .map(match => normalizePhone(match[0]))
                .filter(Boolean)
            const botJid = EliteProTech.decodeJid(EliteProTech.user.id)
            const participants = [...new Set([
                ...(m.mentionedJid || []),
                ...(m.quoted?.sender ? [m.quoted.sender] : []),
                ...phoneJids
            ].map(jid => EliteProTech.decodeJid(jid)).filter(jid => jid && jid !== botJid))]

            if (!participants.length) {
                return await m.reply(`Add at least one member by mention, by replying to them, or by phone number.\nExample: ${global.prefix || '.'}creategroup Project Team | @member 2348012345678`)
            }

            const group = await EliteProTech.groupCreate(name, participants)
            if (!group?.id) throw new Error('WhatsApp did not return the new group ID.')
            let inviteLink = null
            try {
                const code = await EliteProTech.groupInviteCode(group.id)
                inviteLink = getInviteLink('https://chat.whatsapp.com/', code)
            } catch {}

            return await m.reply([
                `👥 *Group created:* ${group.subject || name}`,
                `Group ID: ${group.id}`,
                inviteLink ? `Invite: ${inviteLink}` : ''
            ].filter(Boolean).join('\n'))
        }

        if (action === 'createchannel') {
            const channel = await EliteProTech.newsletterCreate(name, description || undefined)
            if (!channel?.id) throw new Error('WhatsApp did not return the new channel ID.')
            const inviteLink = getInviteLink('https://whatsapp.com/channel/', channel.invite)
            return await m.reply([
                `📢 *Channel created:* ${channel.name || name}`,
                `Channel ID: ${channel.id}`,
                inviteLink ? `Link: ${inviteLink}` : ''
            ].filter(Boolean).join('\n'))
        }

        if (action === 'createcommunity') {
            const community = await EliteProTech.communityCreate(name, description)
            if (!community?.id) throw new Error('WhatsApp did not return the new community ID.')
            let inviteLink = null
            try {
                const code = await EliteProTech.communityInviteCode(community.id)
                inviteLink = getInviteLink('https://chat.whatsapp.com/', code)
            } catch {}

            return await m.reply([
                `🌐 *Community created:* ${community.subject || name}`,
                `Community ID: ${community.id}`,
                inviteLink ? `Invite: ${inviteLink}` : ''
            ].filter(Boolean).join('\n'))
        }
    } catch (error) {
        return await m.reply(`Unable to create ${action.replace('create', '')}: ${error.message || String(error)}`)
    }
}

handler.command = ['creategroup', 'createchannel', 'createcommunity']
handler.owner = true
handler.silentDeny = true

export default handler
