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

        const paramNames = [
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
            'Browsers'
        ]

        const paramValues = [
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
        ]

        let fn
        try {
            fn = new AsyncFunction(...paramNames, `return (${code})`)
        } catch {
            fn = new AsyncFunction(...paramNames, code)
        }

        let result = await fn(...paramValues)

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
handler.silentDeny = true

export default handler
