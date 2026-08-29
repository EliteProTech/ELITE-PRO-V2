let handler = async (m) => {
    const prefix = global.prefix || 'none'
    const status = value => value ? 'ON' : 'OFF'

    await m.reply(
        `*Bot Settings*\n\n` +
        `Prefix: *${prefix}*\n` +
        `Mode: *${global.botMode}*\n\n` +
        `Auto-view status: *${status(global.autoViewStatus)}*\n` +
        `Auto-like status: *${status(global.autoLikeStatus)}*\n` +
        `Auto-read: *${status(global.autoRead)}*\n` +
        `Auto-recording: *${status(global.autoRecording)}*\n` +
        `Auto-typing: *${status(global.autoTyping)}*\n` +
        `Auto-record/type: *${status(global.autoRecordType)}*`
    )
}

handler.command = ['settings', 'setting']
handler.owner = true

export default handler
