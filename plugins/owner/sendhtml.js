import { sendRichHtml } from '../../lib/richhtml.js'

let handler = async (m, { EliteProTech }) => {
    const html = m.quoted?.text?.trim()
    if (!html) {
        return await m.reply(`Reply to a text message containing HTML.\n\nUsage: ${global.prefix || ''}sendhtml`)
    }

    try {
        await sendRichHtml(EliteProTech, m.chat, { id: 'elite-html', title: 'ELITE-PRO-V2', html, source: 'eliteprotech' })
    } catch (error) {
        await m.reply(`Unable to send HTML card: ${error.message || String(error)}`)
    }
}

handler.command = ['sendhtml', 'html']
handler.owner = true

export default handler
