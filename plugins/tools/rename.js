const cleanFileName = value => {
    const name = String(value || '')
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/^\.+$/, '')
        .slice(0, 180)

    return name || ''
}

let handler = async (m, { text, EliteProTech }) => {
    const fileName = cleanFileName(text)
    if (!m.quoted) {
        return await m.reply(`Reply to a file or media, then use ${global.prefix || ''}rename <new-name.extension>`)
    }
    if (!fileName) {
        return await m.reply(`Usage: ${global.prefix || ''}rename index.html`)
    }

    try {
        const file = await m.quoted.download()
        if (!file?.length) throw new Error('The quoted message has no downloadable file.')

        return await EliteProTech.sendMessage(m.chat, {
            document: file,
            mimetype: m.quoted.mimetype || m.quoted.msg?.mimetype || 'application/octet-stream',
            fileName
        }, { quoted: m })
    } catch (error) {
        return await m.reply(`Unable to rename that file: ${error.message || String(error)}`)
    }
}

handler.command = ['rename', 'ren']

export default handler
