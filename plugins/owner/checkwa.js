const handler = async (m, { text, EliteProTech }) => {
    const input = String(text || '').trim()
    if (!input) {
        return m.reply(`Usage: ${global.prefix || '.'}checkwa <international phone number>\nExample: ${global.prefix || '.'}checkwa +2348012345678`)
    }

    // Accept a single phone number with common visual separators, but not JIDs,
    // mentions, or arbitrary text that could accidentally become a number.
    if (!/^\+?[\d\s().-]+$/.test(input)) {
        return m.reply('Send one phone number with country code, for example +2348012345678.')
    }

    const number = input.replace(/\D/g, '')
    if (number.length < 7 || number.length > 15) {
        return m.reply('That number does not look valid. Include the country code (7–15 digits).')
    }

    try {
        const result = await EliteProTech.onWhatsApp(number)

        if (!Array.isArray(result)) {
            return m.reply(`I couldn't verify +${number} right now. Please try again later.`)
        }

        const match = result.find(entry => entry?.exists === true) || result.find(entry => entry?.exists === false)
        if (!match) {
            return m.reply(`No WhatsApp registration was returned for +${number}. This can also happen when WhatsApp cannot complete the lookup.`)
        }

        const state = match.exists ? 'Registered on WhatsApp' : 'Not registered on WhatsApp'
        const jid = typeof match.jid === 'string' ? `\nWhatsApp ID: ${match.jid}` : ''
        return m.reply(`Number: +${number}\nResult: ${state}${jid}\n\nThis checks registration only—not online status, account activity, or ban status.`)
    } catch {
        return m.reply(`WhatsApp could not verify +${number} right now. Try again later; this lookup does not reveal online or ban status.`)
    }
}

handler.command = ['checkwa', 'wauser']
handler.owner = true

export default handler
