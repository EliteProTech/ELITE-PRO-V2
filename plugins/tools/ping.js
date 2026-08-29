let handler = async (m, { EliteProTech }) => {
    const start = Date.now()
    const sent = await EliteProTech.reply(m.chat, 'Speed test..', m)
    const latency = Date.now() - start
    await EliteProTech.sendMessage(m.chat, {
        text: `Pong ${latency}ms`,
        edit: sent.key
    })
}
handler.command = ['ping', 'speed']
export default handler
