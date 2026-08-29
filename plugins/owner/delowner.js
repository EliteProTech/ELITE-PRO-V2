import fs from 'fs'
import path from 'path'

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

function extractNumber(m, args) {
    if (args[0]) {
        const digits = args[0].replace(/[^0-9]/g, '')
        if (digits) return digits
    }
    if (m.mentionedJid?.length) {
        return m.mentionedJid[0].split('@')[0]
    }
    if (m.quoted?.sender) {
        return m.quoted.sender.split('@')[0]
    }
    return null
}

let handler = async (m, { EliteProTech, args }) => {
    const number = extractNumber(m, args)
    if (!number) {
        return await m.reply('Provide a number, mention a user, or reply to their message.\nUsage: .delowner 234xxxxxxxxxx')
    }
    const botNumber = EliteProTech.decodeJid(EliteProTech.user.id).split('@')[0]
    if (number === botNumber) {
        return await m.reply('The primary owner (this bot\'s own number) can\'t be removed this way.')
    }
    const owners = readOwners()
    if (!owners.includes(number)) {
        return await m.reply(`${number} is not in the owner list.`)
    }
    writeOwners(owners.filter(n => n !== number))

    await m.reply(`Removed ${number} from owners.`)
}

handler.command = ['delowner', 'removeowner']
handler.owner = true

export default handler
