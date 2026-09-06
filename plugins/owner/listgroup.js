const chunkText = (text, limit = 3500) => {
    const chunks = []
    let current = ''
    for (const line of text.split('\n')) {
        if (current && current.length + line.length + 1 > limit) {
            chunks.push(current)
            current = ''
        }
        current += `${line}\n`
    }
    if (current) chunks.push(current)
    return chunks
}

let handler = async (m, { EliteProTech }) => {
    let groups = []
    try {
        const participating = await EliteProTech.groupFetchAllParticipating()
        groups = Object.values(participating || {})
    } catch {}

    if (!groups.length) {
        groups = Object.values(EliteProTech.chats || {})
            .filter(chat => chat?.id?.endsWith('@g.us'))
    }

    groups = groups
        .filter(group => group?.id?.endsWith('@g.us'))
        .sort((a, b) => String(a.subject || a.name || '').localeCompare(String(b.subject || b.name || '')))

    if (!groups.length) return await m.reply('No groups were found in the current session.')

    const lines = groups.map((group, index) => {
        const name = group.subject || group.name || 'Unnamed Group'
        return `${index + 1}. *${name}*\n   ${group.id}`
    })
    const pages = chunkText(`*Group List*\n\n${lines.join('\n\n')}\n\n*Total:* ${groups.length} group(s)`)

    for (const [index, page] of pages.entries()) {
        const text = pages.length > 1 ? `${page.trim()}\n\n_Page ${index + 1}/${pages.length}_` : page.trim()
        await EliteProTech.sendMessage(m.chat, { text }, { quoted: index === 0 ? m : undefined })
    }
}

handler.command = ['listgroup', 'groups']
handler.owner = true

export default handler
