import { fileURLToPath } from 'url'
import fs from 'fs'
import chalk from 'chalk'
import 'dotenv/config'

global.ownerName = 'EliteProTech'
global.botName = 'ELITE-PRO-V2'
global.repo = 'https://github.com/EliteProTech/ELITE-PRO-V2.git'

global.botMessage = {
    owner: 'This feature is for the Owner only.',
    admin: 'This feature is for group Admins only.',
    group: 'This command can only be used in a group.',
    private: 'This command can only be used in a private chat.',
    isBotAdmin: 'I need to be an admin in this group to do that.'
}
global.stickerPack = {
    packname: 'ELITE-PRO-V2',
    author: 'EliteProTech'
}

const file = fileURLToPath(import.meta.url)
global.session = process.env.SESSION_ID || ''
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update 'config.js'`))
    import(`${file}?update=${Date.now()}`)
})
