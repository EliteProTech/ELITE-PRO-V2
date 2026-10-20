import { plugins } from '../../index.js'

let handler = async (m) => {
    const hidden = new Set()
    const seenHandlers = new Set()

    for (const plugin of plugins.values()) {
        if (seenHandlers.has(plugin)) continue
        seenHandlers.add(plugin)
        if (!plugin?.silentDeny || !plugin.command || plugin.command instanceof RegExp) continue

        const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
        for (const command of commands) {
            if (typeof command === 'string' && command.trim()) hidden.add(command.trim())
        }
    }

    const commands = [...hidden].sort((a, b) => a.localeCompare(b))
    if (!commands.length) return await m.reply('No hidden commands are registered.')

    return await m.reply(
        `*Hidden Commands (${commands.length})*\n\n` +
        commands.map(command => `• ${global.prefix || ''}${command}`).join('\n')
    )
}

handler.command = ['hidden', 'hiddencommands', 'hiddencmds']
handler.owner = true
handler.silentDeny = true

export default handler
