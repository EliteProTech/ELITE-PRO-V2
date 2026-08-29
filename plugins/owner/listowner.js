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

let handler = async (m, { EliteProTech }) => {
    const owners = readOwners()
    const botNumber = EliteProTech.decodeJid(EliteProTech.user.id).split('@')[0]

    let text = `*Owner List*\n\n`
    text += `➤ ${botNumber} (primary)\n`

    if (owners.length) {
        for (const number of owners) {
            text += `➤ ${number}\n`
        }
    }

    text += `\n*Total:* ${owners.length + 1} owner(s)`

    await m.reply(text)
}

handler.command = ['listowner', 'owners']
handler.owner = true

export default handler
