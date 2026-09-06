import { plugins } from '../../index.js'

const formatUptime = seconds => {
    const total = Math.floor(seconds)
    const days = Math.floor(total / 86400)
    const hours = Math.floor((total % 86400) / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const remaining = total % 60
    return [days && `${days}d`, hours && `${hours}h`, minutes && `${minutes}m`, `${remaining}s`]
        .filter(Boolean)
        .join(' ')
}

let handler = async (m) => {
    const byCategory = {}
    const seen = new Set()
    const pushName = String(m.pushName || 'User').trim().replace(/[*_`~]/g, '') || 'User'

    for (const h of plugins.values()) {
        if (seen.has(h)) continue
        seen.add(h)

        if (h.silentDeny) continue
        if (!h.command || h.command instanceof RegExp) continue

        const category = h.category || 'Other'
        if (!byCategory[category]) byCategory[category] = []

        const commands = (Array.isArray(h.command) ? h.command : [h.command])
            .filter(Boolean)
            .map(command => `${global.prefix || ''}${command}`)

        if (commands.length) byCategory[category].push(...commands)
    }

    let text = `╭━━━〔 *${global.botName}* 〕━━━╮\n`
    text += `┃ 👤 *User:* ${pushName}\n`
    text += `┃ ⚙️ *Mode:* ${global.botMode}\n`
    text += `┃ 🔖 *Prefix:* ${global.prefix || 'none'}\n`
    text += `┃ ⏱️ *Uptime:* ${formatUptime(process.uptime())}\n`
    text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`

    for (const category of Object.keys(byCategory).sort()) {
        text += `╭─〔 *${category.toUpperCase()}* 〕\n`

        const commands = [...new Set(byCategory[category])].sort()

        for (const command of commands) {
            text += `│ ✦ ${command}\n`
        }

        text += `╰──────────────\n\n`
    }

    await m.reply(`${text.trim()}\n\n> Powered by EliteProTech`)
}

handler.command = ['menu', 'help']

export default handler
