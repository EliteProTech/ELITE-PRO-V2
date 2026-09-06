let handler = async (m, { EliteProTech }) => {
    await m.reply('Restarting bot...')
    setTimeout(() => {
        try {
            EliteProTech.ev.removeAllListeners()
            EliteProTech.ws?.close?.()
        } catch {}
        process.exit(0)
    }, 750)
}

handler.command = ['restart', 'reboot']
handler.owner = true
handler.silentDeny = true

export default handler
