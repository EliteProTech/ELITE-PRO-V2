let handler = async (m, { EliteProTech, text }) => {
    const values = text.split('|').map(value => value.trim()).filter(Boolean)
    const [name, ...options] = values

    if (!name || options.length < 2) {
        return await m.reply(`Usage: ${global.prefix || ''}poll Question | Option 1 | Option 2`)
    }

    try {
        await EliteProTech.sendMessage(m.chat, {
            poll: {
                name,
                values: options,
                selectableCount: 1
            }
        }, { quoted: m })
    } catch (error) {
        await m.reply(`Unable to create poll: ${error.message || String(error)}`)
    }
}

handler.command = ['poll']

export default handler
