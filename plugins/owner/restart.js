import { requestRestart } from '../../index.js'

let handler = async (m, { EliteProTech }) => {
    await m.reply('Restarting bot...')
    setTimeout(() => {
        try {
            EliteProTech.ev.removeAllListeners()
            EliteProTech.ws?.close?.()
        } catch {}
        requestRestart()
    }, 750)
}

handler.command = ['restart', 'reboot']
handler.owner = true
handler.silentDeny = true

export default handler
