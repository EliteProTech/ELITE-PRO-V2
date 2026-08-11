import util from 'util'
import * as baileys from '@whiskeysockets/baileys'

const {
    default: makeWASocket,
    proto,
    generateWAMessageFromContent,
    generateWAMessage,
    generateWAMessageContent,
    prepareWAMessageMedia,
    downloadContentFromMessage,
    downloadAndSaveMediaMessage,
    jidNormalizedUser,
    getContentType,
    fetchLatestBaileysVersion,
    useSingleFileAuthState,
    makeInMemoryStore,
    DisconnectReason,
    Browsers
} = baileys

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

let handler = async (m, {
    EliteProTech,
    args,
    text,
    command,
    prefix,
    notifReply
}) => {
    try {
        const code = m.text.slice(prefix.length + command.length).trim()

        if (!code) {
            return await m.reply('Please provide code to evaluate.')
        }

        const fn = new AsyncFunction(
            'EliteProTech',
            'm',
            'args',
            'text',
            'command',
            'prefix',
            'notifReply',
            'baileys',
            'makeWASocket',
            'proto',
            'generateWAMessageFromContent',
            'generateWAMessage',
            'generateWAMessageContent',
            'prepareWAMessageMedia',
            'downloadContentFromMessage',
            'downloadAndSaveMediaMessage',
            'jidNormalizedUser',
            'getContentType',
            'fetchLatestBaileysVersion',
            'useSingleFileAuthState',
            'makeInMemoryStore',
            'DisconnectReason',
            'Browsers',
            `
            return (async () => {
                ${code}
            })()
            `
        )

        let result = await fn(
            EliteProTech,
            m,
            args,
            text,
            command,
            prefix,
            notifReply,
            baileys,
            makeWASocket,
            proto,
            generateWAMessageFromContent,
            generateWAMessage,
            generateWAMessageContent,
            prepareWAMessageMedia,
            downloadContentFromMessage,
            downloadAndSaveMediaMessage,
            jidNormalizedUser,
            getContentType,
            fetchLatestBaileysVersion,
            useSingleFileAuthState,
            makeInMemoryStore,
            DisconnectReason,
            Browsers
        )

        if (typeof result !== 'string') {
            result = util.inspect(result, {
                depth: null,
                colors: false
            })
        }

        await m.reply(result || 'undefined')
    } catch (e) {
        await m.reply(util.inspect(e, {
            depth: null,
            colors: false
        }))
    }
}

handler.command = ['eval']
handler.owner = true

export default handler
