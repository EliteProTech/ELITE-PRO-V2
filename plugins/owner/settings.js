import { getAntiCallSettings } from '../../lib/anticall.js'

let handler = async (m) => {
    const prefix = global.prefix || 'none'
    const status = value => value ? 'ON' : 'OFF'
    const antiCall = getAntiCallSettings()

    await m.reply(
        `*Bot Settings*\n\n` +
        `Prefix: *${prefix}*\n` +
        `Mode: *${global.botMode}*\n\n` +
        `Auto-view status: *${status(global.autoViewStatus)}*\n` +
        `Auto-like status: *${status(global.autoLikeStatus)}* (${global.autoLikeStatusEmojis?.join(' ') || '💚'})\n` +
        `Auto-react: *${status(global.autoReact)}* (${global.autoReactEmojis?.join(' ') || '💚'})\n` +
        `Anti-view-once: *${global.antiViewOnceGlobal ? 'GLOBAL ON' : 'GLOBAL OFF'}* (${Object.keys(global.antiViewOnceGroups || {}).length} group rule(s))\n` +
        `Anti-delete: *${status(global.antiDelete)}* (${global.antiDeleteMode === 'chat' ? 'same chat' : 'owner DM'})\n` +
        `Auto-read: *${status(global.autoRead)}*\n` +
        `Auto-recording: *${status(global.autoRecording)}*\n` +
        `Auto-typing: *${status(global.autoTyping)}*\n` +
        `Auto-record/type: *${status(global.autoRecordType)}*\n` +
        `Anti-call: *${antiCall.action}* (${antiCall.scope})`
    )
}

handler.command = ['settings', 'setting']
handler.owner = true

export default handler
