import fs from 'fs'
import path from 'path'
import { getGroupMetadata } from '../../lib/myfunc.js'

const OWNER_DB_PATH = path.join(process.cwd(), 'database', 'owner.json')

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
    let jid = m.mentionedJid?.[0] || m.quoted?.sender
    if (!jid) {
        const value = String(args.find(arg => !arg.startsWith('@')) || '').trim()
        if (value.endsWith('@lid')) return value
        return value.replace(/[^0-9]/g, '') || null
    }
    if (jid.endsWith('@lid') && m.isGroup) {
        const metadata = await getGroupMetadata(EliteProTech, m.chat, true)
        const participant = metadata?.participants?.find(p => p.id === jid || p.lid === jid)
        jid = participant?.phoneNumber || jid
    }
    if (jid.endsWith('@lid')) jid = await EliteProTech.resolveLidToJid(jid)
    return jid?.endsWith('@lid') ? (m.mentionedJid?.[0] || m.quoted?.sender) : jid?.split('@')[0].replace(/\D/g, '')
}

let handler = async (m, { EliteProTech, args }) => {
    const ownerId = await extractOwner(m, EliteProTech, args)
    if (!ownerId) {
        return await m.reply(`Provide a number or LID, mention a user, or reply to their message.\nUsage: ${global.prefix || ''}delowner 234xxxxxxxxxx`)
    }
    const botNumber = EliteProTech.decodeJid(EliteProTech.user.id).split('@')[0]
    if (ownerId === botNumber) {
        return await m.reply('The primary owner (this bot\'s own number) can\'t be removed this way.')
    }
    const owners = readOwners()
    if (!owners.includes(ownerId)) {
        return await m.reply(`${ownerId} is not in the owner list.`)
    }
    writeOwners(owners.filter(id => id !== ownerId))

    await m.reply(`Removed ${ownerId} from owners.`)
}

handler.command = ['delowner', 'removeowner']
handler.owner = true

export default handler
