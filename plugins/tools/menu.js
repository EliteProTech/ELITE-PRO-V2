import { plugins } from '../../index.js'

let handler = async (m) => {
    const byCategory = {}
    const seen = new Set()

    for (const h of plugins.values()) {
        if (seen.has(h)) continue
        seen.add(h)

        if (h.silentDeny) continue
        if (!h.command || h.command instanceof RegExp) continue

        const category = h.category || 'Other'
        if (!byCategory[category]) byCategory[category] = []

        const commands = Array.isArray(h.command) ? h.command : [h.command]
        const commandText = commands
            .filter(Boolean)
            .map(command => `${global.prefix || ''}${command}`)
            .join(' / ')

        if (commandText) byCategory[category].push(commandText)
    }

    let text = `*${global.botName} — Menu*\n`
    text += `Prefix: ${global.prefix || 'none'} | Mode: ${global.botMode}\n\n`

    for (const category of Object.keys(byCategory).sort()) {
        text += `*${category}*\n`

        const commands = [...new Set(byCategory[category])].sort()

        for (const command of commands) {
            text += `➤ ${command}\n`
        }

        text += '\n'
    }

    await m.reply(text.trim())
}

handler.command = ['menu', 'help']

export default handler
