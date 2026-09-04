import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const databasePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'database', 'groupsettings.json')

export const defaultGroupSettings = {
    antiLink: 'off',
    antiLinkLimit: 3,
    antiLinkUsers: {},
    antiGroupStatus: 'off',
    antiGroupStatusLimit: 3,
    antiGroupStatusUsers: {},
    welcome: false,
    goodbye: false,
    welcomeMessage: 'Welcome {user} to *{group}*!\n\nMembers: *{count}*',
    goodbyeMessage: 'Goodbye {user} from *{group}*.'
}

function readAll() {
    try {
        const data = JSON.parse(fs.readFileSync(databasePath, 'utf-8'))
        return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
    } catch {
        return {}
    }
}

function writeAll(settings) {
    fs.writeFileSync(databasePath, JSON.stringify(settings, null, 2))
}

export function getGroupSettings(chat) {
    return { ...defaultGroupSettings, ...(readAll()[chat] || {}) }
}

export function updateGroupSettings(chat, changes) {
    const all = readAll()
    all[chat] = { ...defaultGroupSettings, ...(all[chat] || {}), ...changes }
    writeAll(all)
    return all[chat]
}

export function formatGroupTemplate(template, { jid, group, count }) {
    return String(template)
        .replaceAll('{user}', `@${jid.split('@')[0]}`)
        .replaceAll('{group}', group || 'this group')
        .replaceAll('{count}', String(count ?? 0))
}
