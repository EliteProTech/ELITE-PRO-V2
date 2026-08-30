import fs from 'fs'
import path from 'path'
import { getGroupMetadata } from '../../lib/myfunc.js'

const OWNER_DB_PATH = path.join(process.cwd(), 'lib', 'database', 'owner.json')

function readOwners() {
    try {
        return JSON.parse(fs.readFileSync(OWNER_DB_PATH, 'utf-8'))
    } catch {
        return []
    }
}
function writeOwners(owners) {
    fs.writeFileSync(OWNER_DB_PATH, JSON.stringify(owners, null, 2))
}
async function extractOwner(m, EliteProTech, args) {
    const originalJid = m.mentionedJid?.[0] || m.quoted?.sender
    if (!originalJid) {
        const value = args.find(arg => !arg.startsWith('@'))
        const digits = value?.replace(/[^0-9]/g, '')
        return digits ? { number: digits, legacyLidNumber: null } : null
    }

    let jid = originalJid
    if (jid.endsWith('@lid') && m.isGroup) {
        const metadata = await getGroupMetadata(EliteProTech, m.chat, true)
        const participant = metadata?.participants?.find(p => p.id === jid || p.lid === jid)
        jid = participant?.phoneNumber || jid
    }
    if (jid.endsWith('@lid')) jid = await EliteProTech.resolveLidToJid(jid)
    if (!jid || jid.endsWith('@lid')) return null

    return {
        number: jid.split('@')[0].replace(/\D/g, ''),
        legacyLidNumber: originalJid.endsWith('@lid') ? originalJid.split('@')[0] : null
    }
}

let handler = async (m, { EliteProTech, args }) => {
    const target = await extractOwner(m, EliteProTech, args)
    if (!target?.number) {
        return await m.reply(`Provide a number, mention a user, or reply to their message.\nUsage: ${global.prefix || ''}addowner 234xxxxxxxxxx`)
    }
    const { number, legacyLidNumber } = target
    const botNumber = EliteProTech.decodeJid(EliteProTech.user.id).split('@')[0]
    if (number === botNumber) {
        return await m.reply('That number is already the primary owner.')
    }
    const owners = readOwners()
    if (owners.includes(number)) {
        return await m.reply(`${number} is already an owner.`)
    }
    writeOwners([...new Set([...owners.filter(owner => owner !== legacyLidNumber), number])])

    await m.reply(`Added ${number} as an owner.`)
}

handler.command = ['addowner']
handler.owner = true

export default handler
