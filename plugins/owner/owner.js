let handler = async (m, { EliteProTech }) => {
    const jid = EliteProTech.decodeJid(EliteProTech.user.id)
    const number = jid.split('@')[0]
    const name = EliteProTech.user.name || global.ownerName || global.botName || 'Owner'

    const vcard = `BEGIN:VCARD\n`
        + `VERSION:3.0\n`
        + `FN:${name}\n`
        + `ORG:${global.botName || ''};\n`
        + `TEL;type=CELL;type=VOICE;waid=${number}:+${number}\n`
        + `END:VCARD`

    await EliteProTech.sendMessage(m.chat, {
        contacts: {
            displayName: name,
            contacts: [{ vcard }]
        }
    }, { quoted: m })
}

handler.command = ['owner']

export default handler
