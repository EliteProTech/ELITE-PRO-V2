import fs from 'fs'
import path from 'path'

const MODE_PATH = path.join(process.cwd(), 'lib', 'database', 'settings.json')

function readMode() {
    try {
        return JSON.parse(fs.readFileSync(MODE_PATH, 'utf-8'))
    } catch {
        return {}
    }
}

function writeMode(data) {
    fs.writeFileSync(MODE_PATH, JSON.stringify(data, null, 2))
}

let handler = async (m, { args }) => {
    const choice = args[0]?.toLowerCase()

    if (!choice) {
        return await m.reply(`Current mode: *${global.botMode}*\n\nUsage: .mode self | .mode public`)
    }

    if (choice !== 'self' && choice !== 'public') {
        return await m.reply('Invalid mode. Usage: .mode self | .mode public')
    }

    global.botMode = choice
    writeMode({ mode: choice })

    await m.reply(`Bot mode set to *${choice}*.${choice === 'self' ? ' Only the owner can use commands now.' : ' Anyone can use commands now.'}`)
}

handler.command = ['mode']
handler.owner = true

export default handler
