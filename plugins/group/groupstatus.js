import { generateWAMessageFromContent, prepareWAMessageMedia, proto } from '@whiskeysockets/baileys'

const COLORS = {
    green: 0xFF25D366,
    red: 0xFFFF0000,
    blue: 0xFF0000FF,
    yellow: 0xFFFFFF00,
    purple: 0xFF800080,
    black: 0xFF000000,
    white: 0xFFFFFFFF,
    orange: 0xFFFFA500
}

const MEDIA_TYPES = new Set(['imageMessage', 'videoMessage', 'audioMessage'])

function parseTextAndColor(input = '') {
    const [text, colorName] = input.split(/,(.+)/).map(value => value?.trim())
    return { text, color: COLORS[colorName?.toLowerCase()] }
}

let handler = async (m, { text, EliteProTech }) => {
    const quoted = m.quoted
    const hasMedia = MEDIA_TYPES.has(quoted?.mtype)
    const { text: statusText, color } = parseTextAndColor(text)

    if (!hasMedia && !statusText) {
        return await m.reply(
            `Send text or reply to an image, video, or audio.\n\n` +
            `Examples:\n${global.prefix || ''}groupstatus Hello everyone\n` +
            `${global.prefix || ''}groupstatus Hello everyone,blue\n` +
            `Colors: ${Object.keys(COLORS).join(', ')}`
        )
    }

    try {
        let message

        if (hasMedia) {
            const media = await quoted.download()
            const caption = quoted.text || quoted.caption || ''
            const mediaContent = quoted.mtype === 'imageMessage'
                ? { image: media, caption }
                : quoted.mtype === 'videoMessage'
                    ? { video: media, caption }
                    : {
                        audio: media,
                        mimetype: quoted.mimetype || 'audio/mpeg',
                        ptt: Boolean(quoted.msg?.ptt),
                        seconds: quoted.msg?.seconds,
                        waveform: quoted.msg?.waveform
                    }

            const prepared = await prepareWAMessageMedia(mediaContent, { upload: EliteProTech.waUploadToServer })
            const mediaMessage = quoted.mtype === 'imageMessage'
                ? { imageMessage: prepared.imageMessage }
                : quoted.mtype === 'videoMessage'
                    ? { videoMessage: prepared.videoMessage }
                    : { audioMessage: prepared.audioMessage }

            message = { groupStatusMessageV2: { message: mediaMessage } }
        } else {
            message = {
                groupStatusMessageV2: {
                    message: {
                        extendedTextMessage: {
                            text: statusText,
                            backgroundArgb: color ?? (0xFF000000 + Math.floor(Math.random() * 0xFFFFFF)),
                            font: 2
                        }
                    }
                }
            }
        }

        const generated = generateWAMessageFromContent(m.chat, proto.Message.fromObject(message), {
            userJid: EliteProTech.user.id,
            quoted: m
        })
        await EliteProTech.relayMessage(m.chat, generated.message, { messageId: generated.key.id })
        await EliteProTech.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    } catch (error) {
        await m.reply(`Unable to send group status: ${error.message || String(error)}`)
    }
}

handler.command = ['groupstatus', 'gcstatus']
handler.group = true
handler.owner = true

export default handler
