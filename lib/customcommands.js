import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const databasePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'database', 'customcommands.json')

function readCommands() {
    try {
        const data = JSON.parse(fs.readFileSync(databasePath, 'utf-8'))
        return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
    } catch {
        return {}
    }
}

function writeCommands(commands) {
    fs.writeFileSync(databasePath, JSON.stringify(commands, null, 2))
}

export function getCustomCommand(name) {
    const value = readCommands()[String(name).toLowerCase()]
    return typeof value === 'string' ? value : null
}

export function setCustomCommand(name, response) {
    const commands = readCommands()
    commands[String(name).toLowerCase()] = response
    writeCommands(commands)
}

export function deleteCustomCommand(name) {
    const commands = readCommands()
    const key = String(name).toLowerCase()
    if (!(key in commands)) return false
    delete commands[key]
    writeCommands(commands)
    return true
}

export function listCustomCommands() {
    return Object.entries(readCommands()).sort(([left], [right]) => left.localeCompare(right))
}
