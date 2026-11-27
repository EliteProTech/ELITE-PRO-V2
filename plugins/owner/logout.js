import { requestReplyConfirmation } from '../../lib/confirmations.js'

let handler = async (m, { text, EliteProTech }) => {
    if (text?.trim()) return await m.reply(`Reply to the confirmation message with *confirm*.\nUsage: ${global.prefix || ''}logout`)

    await requestReplyConfirmation(EliteProTech, m, {
        text: '⚠️ This will log the bot out of WhatsApp.\n\nReply to this message with *confirm* within 60 seconds to continue.',
        requirements: { owner: true },
        execute: async (confirmation, socket) => {
            try {
                await confirmation.reply('Logging out...')
                await socket.logout()
            } catch (error) {
                await confirmation.reply(`Logout failed: ${error.message || String(error)}`)
            }
        }
    })
}

handler.command = ['logout']
handler.owner = true
handler.silentDeny = true

export default handler
