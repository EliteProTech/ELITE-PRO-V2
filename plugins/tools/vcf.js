import { getGroupMetadata } from '../../lib/myfunc.js'

function escapeVCard(value) {
    return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/\r?\n/g, '\\n')
        .replace(/([,;])/g, '\\$1')
}

let handler = async (m, { EliteProTech, args, text = '' }) => {
    let target = m.quoted?.sender || m.mentionedJid?.[0] || ''
    let name = ''

    if (target) {
        const participant = m.isGroup
            ? (await getGroupMetadata(EliteProTech, m.chat))?.participants?.find(item =>
                [item.id, item.lid, item.phoneNumber].filter(Boolean).includes(target)
            )
            : null
        target = participant?.phoneNumber || target
        if (target.endsWith('@lid')) {
            try { target = await EliteProTech.resolveLidToJid(target) } catch {}
        }
        if (target?.endsWith('@lid')) {
            return await m.reply('I could not resolve that LID to a phone number. Try a reply/mention where the group provides the member’s phone number.')
        }
        name = args.filter(arg => !/^@/.test(arg)).join(' ').trim()
    } else {
        const match = String(text).trim().match(/^(\+?\d{7,15})(?:\s+(.+))?$/)
        if (!match) return await m.reply(`Usage: ${global.prefix || '.'}vcf <country-code and number> [name]\nOr reply to/mention someone.`)
        target = `${match[1].replace(/\D/g, '')}@s.whatsapp.net`
        name = match[2]?.trim() || ''
    }

    const number = target?.split('@')[0]?.replace(/\D/g, '')
    if (!number || number.length < 7 || number.length > 15) {
        return await m.reply('I could not resolve that person to a phone number. Try using their full number with country code.')
    }

    name = name || EliteProTech.contacts?.[target]?.name || `Contact ${number}`
    const safeName = escapeVCard(name.slice(0, 80))
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${safeName}\nTEL;type=CELL;type=VOICE;waid=${number}:+${number}\nEND:VCARD`

    return await EliteProTech.sendMessage(m.chat, {
        contacts: { displayName: name, contacts: [{ vcard }] }
    }, { quoted: m })
}

handler.command = ['vcf', 'contactcard']

export default handler
