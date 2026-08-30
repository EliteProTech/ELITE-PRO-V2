import { getGroupMetadata } from '../../lib/myfunc.js'

const MEDIA_KEY_BY_MTYPE = {
    imageMessage: 'image',
    videoMessage: 'video',
    stickerMessage: 'sticker',
    audioMessage: 'audio'
}

let handler = async (m, { EliteProTech, text }) => {
    const metadata = await getGroupMetadata(EliteProTech, m.chat, true)
    const participants = metadata?.participants || []

    if (participants.length === 0) {
        return await m.reply('No participants found in this group.')
    }

    const mentions = []
    for (const p of participants) {
        const jid = EliteProTech.decodeJid(p.phoneNumber || await EliteProTech.resolveLidToJid(p.id) || p.id)
        if (jid && !mentions.includes(jid)) mentions.push(jid)
    }

    const caption = text?.trim() || m.quoted?.text || ''
    const quotedType = m.quoted?.mtype
    const mediaKey = quotedType && MEDIA_KEY_BY_MTYPE[quotedType]

    if (m.quoted && mediaKey) {
        const buffer = await m.quoted.download()
        const payload = { [mediaKey]: buffer, mentions }

        if (mediaKey === 'image' || mediaKey === 'video') payload.caption = caption
        if (mediaKey === 'audio') {
            payload.mimetype = m.quoted.mimetype || 'audio/ogg; codecs=opus'
            if (m.quoted.msg?.ptt) payload.ptt = true
        }

        await EliteProTech.sendMessage(m.chat, payload, { quoted: m })
        return
    }

    if (!caption) {
        return await m.reply(`Provide a message or reply to something to tag everyone with it.\nUsage: ${global.prefix || ''}totag <message>`)
    }

    await EliteProTech.sendMessage(m.chat, { text: caption, mentions }, { quoted: m })
}

handler.command = ['totag', 'hidetag']
handler.group = true
handler.admin = true
handler.ownerBypassAdmin = true
handler.isBotAdmin = true

export default handler
