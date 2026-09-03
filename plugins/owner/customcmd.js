import { plugins } from '../../index.js'
import {
    deleteCustomCommand,
    listCustomCommands,
    setCustomCommand
} from '../../lib/customcommands.js'

const validName = name => /^[a-z0-9_-]{1,32}$/.test(name)

let handler = async (m, { text, command }) => {
    if (command === 'listcmd') {
        const commands = listCustomCommands()
        if (!commands.length) return await m.reply('No custom commands have been added.')

        const lines = commands.map(([name, response]) => `➤ ${global.prefix || ''}${name} — ${response.slice(0, 80)}${response.length > 80 ? '…' : ''}`)
        return await m.reply(`*Custom Commands*\n\n${lines.join('\n')}\n\n*Total:* ${commands.length}`)
    }

    const name = text.trim().toLowerCase()
    if (command === 'delcmd') {
        if (!validName(name)) return await m.reply(`Usage: ${global.prefix || ''}delcmd <command>`)
        if (!deleteCustomCommand(name)) return await m.reply(`No custom command named *${name}* exists.`)
        return await m.reply(`Deleted custom command *${name}*.`)
    }

    const divider = text.indexOf('|')
    if (divider < 1) {
        return await m.reply(`Usage: ${global.prefix || ''}addcmd <command> | <reply text>`)
    }

    const commandName = text.slice(0, divider).trim().toLowerCase()
    const response = text.slice(divider + 1).trim()
    if (!validName(commandName)) return await m.reply('Command names can only use lowercase letters, numbers, hyphens, and underscores.')
    if (!response || response.length > 4000) return await m.reply('Reply text must be between 1 and 4000 characters.')
    if (plugins.has(commandName)) return await m.reply(`*${commandName}* is already a built-in command.`)

    setCustomCommand(commandName, response)
    await m.reply(`Added custom command *${commandName}*.`)
}

handler.command = ['addcmd', 'delcmd', 'listcmd']
handler.owner = true

export default handler
