import fs from 'fs'
import path from 'path'
import { plugins } from '../../index.js'

function getPluginFiles(dir, baseDir = dir) {
    const files = []

    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, item.name)

        if (item.isDirectory()) {
            files.push(...getPluginFiles(fullPath, baseDir))
        } else if (item.isFile() && item.name.endsWith('.js')) {
            files.push({
                file: fullPath,
                relative: path.relative(baseDir, fullPath)
            })
        }
    }

    return files
}

function getCategory(relativePath) {
    const parts = relativePath.split(path.sep)

    if (parts.length > 1) {
        return parts[0]
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
    }

    return 'Other'
}

let handler = async (m) => {
    const pluginDir = path.join(process.cwd(), 'plugins')
    const files = getPluginFiles(pluginDir)

    const byCategory = {}
    const seenHandlers = new Set()

    for (const item of files) {
        const moduleUrl =
            `file://${item.file.replace(/\\/g, '/')}`

        try {
            const module = await import(
                `${moduleUrl}?menu=${Date.now()}`
            )

            const h = module.default

            if (!h) continue
            if (h.silentDeny) continue
            if (!h.command || h.command instanceof RegExp) continue
            if (seenHandlers.has(h)) continue

            seenHandlers.add(h)

            const category = getCategory(item.relative)

            if (!byCategory[category]) {
                byCategory[category] = []
            }

            const commands = Array.isArray(h.command)
                ? h.command
                : [h.command]

            const commandText = commands
                .filter(Boolean)
                .map(command => `${global.prefix}${command}`)
                .join(' / ')

            if (commandText) {
                byCategory[category].push(commandText)
            }

        } catch (err) {
            console.error(
                `[MENU] Failed to load ${item.relative}:`,
                err.message
            )
        }
    }

    let text = `*${global.botName} — Menu*\n`
    text += `Prefix: ${global.prefix} | Mode: ${global.botMode}\n\n`

    for (const category of Object.keys(byCategory).sort()) {
        text += `*${category}*\n`

        const commands = [
            ...new Set(byCategory[category])
        ].sort()

        for (const command of commands) {
            text += `➤ ${command}\n`
        }

        text += '\n'
    }

    await m.reply(text.trim())
}

handler.command = ['menu', 'help']

export default handler
