import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const databasePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'database', 'anticall.json')

const defaults = {
    action: 'off',
    scope: 'all',
    numbers: [],
    groups: []
}

export const getAntiCallSettings = () => {
    try {
        const saved = JSON.parse(fs.readFileSync(databasePath, 'utf8'))
        return {
            ...defaults,
            ...saved,
            numbers: Array.isArray(saved.numbers) ? saved.numbers : [],
            groups: Array.isArray(saved.groups) ? saved.groups : []
        }
    } catch {
        return { ...defaults }
    }
}

export const setAntiCallSettings = changes => {
    const settings = { ...getAntiCallSettings(), ...changes }
    fs.writeFileSync(databasePath, JSON.stringify(settings, null, 2))
    return settings
}
