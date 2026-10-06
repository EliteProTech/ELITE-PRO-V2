import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const pluginDirectory = path.dirname(fileURLToPath(import.meta.url))
const databasePath = path.resolve(pluginDirectory, '../../database/banks.json')

const loadBanks = () => {
    try {
        const data = JSON.parse(fs.readFileSync(databasePath, 'utf8'))
        return data && typeof data === 'object' ? data : {}
    } catch {
        return {}
    }
}

const saveBanks = banks => {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true })
    fs.writeFileSync(databasePath, JSON.stringify(banks, null, 2))
}

const quotedText = quoted => String(
    quoted?.text ||
    quoted?.caption ||
    quoted?.msg?.text ||
    quoted?.msg?.caption ||
    quoted?.msg?.conversation ||
    ''
).trim()

const parseDetails = value => {
    const parts = String(value || '').split('|').map(part => part.trim())
    if (parts.length !== 3 || parts.some(part => !part)) {
        throw new Error('Use: Bank Name|Account Number|Account Name')
    }

    const [bankName, accountNumber, accountName] = parts
    if (bankName.length > 80 || accountName.length > 100) {
        throw new Error('Bank and account names are too long.')
    }
    if (!/^[A-Za-z0-9 -]{4,34}$/.test(accountNumber)) {
        throw new Error('Use a valid account number (4–34 letters, numbers, spaces, or hyphens).')
    }

    return { bankName, accountNumber, accountName }
}

let handler = async (m, { command, text }) => {
    const commandName = String(command || '').toLowerCase()
    const banks = loadBanks()
    const userId = m.sender

    if (commandName === 'bank') {
        const details = banks[userId]
        if (!details) {
            return await m.reply(`You have not saved bank details yet.\n\nUse: ${global.prefix || ''}setbank Bank Name|Account Number|Account Name`)
        }
        return await m.reply(`*Bank Details*\n\nBank: ${details.bankName}\nAccount Name: ${details.accountName}\nAccount Number: ${details.accountNumber}`)
    }

    if (commandName === 'delbank' || commandName === 'deletebank') {
        if (!banks[userId]) return await m.reply('You do not have saved bank details.')
        delete banks[userId]
        saveBanks(banks)
        return await m.reply('Your bank details have been deleted.')
    }

    const input = String(text || '').trim() || quotedText(m.quoted)
    if (!input) {
        return await m.reply(`Usage: ${global.prefix || ''}setbank Bank Name|Account Number|Account Name\n\nYou can also reply to a message containing those details.`)
    }

    try {
        const details = parseDetails(input)
        banks[userId] = details
        saveBanks(banks)
        return await m.reply(`Your bank details have been saved. Use ${global.prefix || ''}setbank again any time to replace them.`)
    } catch (error) {
        return await m.reply(error.message || String(error))
    }
}

handler.command = ['setbank', 'bank', 'delbank', 'deletebank']

export default handler
