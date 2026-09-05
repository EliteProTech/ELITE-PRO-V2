import { proto } from '@whiskeysockets/baileys'

const toCodeObject = value => JSON.stringify(value, null, 2).replace(
    /^(\s*)"([A-Za-z_$][A-Za-z0-9_$]*)":/gm,
    '$1$2:'
)

const additionalNodes = [
    {
        tag: 'biz',
        attrs: {},
        content: [
            {
                tag: 'interactive',
                attrs: { type: 'native_flow', v: '1' },
                content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
            }
        ]
    }
]

let handler = async (m, { EliteProTech }) => {
    try {
        const quoted = m.quoted

        if (!quoted) {
            return await m.reply('Please reply to a message first.')
        }

        const key = quoted.fakeObj?.key
        const original = EliteProTech.getStoredMessage?.(key) || quoted.rawMessage || quoted.fakeObj?.rawMessage || quoted.message || quoted.fakeObj?.message
        if (!original) {
            return await m.reply('Quoted message data is unavailable.')
        }

        const result = proto.Message.toObject(proto.Message.fromObject(original), {
            enums: Number,
            longs: String,
            bytes: String
        })

        const dataPath = result?.botForwardedMessage?.message?.richResponseMessage?.unifiedResponse
        let dataCode = null
        if (dataPath?.data) {
            try {
                const parsed = JSON.parse(Buffer.from(dataPath.data, 'base64').toString('utf8'))
                dataCode = `Buffer.from(JSON.stringify(${toCodeObject(parsed)}), 'utf8').toString('base64')`
                dataPath.data = '__DATA_CODE_MARKER__'
            } catch {}
        }

        let messageCode = toCodeObject(result)
        if (dataCode) messageCode = messageCode.replace('"__DATA_CODE_MARKER__"', dataCode)

        const fullCodeText = `try {
    const msg = generateWAMessageFromContent(
        m.chat,
        ${messageCode},
        {
            userJid: EliteProTech.user.id,
            quoted: m
        }
    )

    await EliteProTech.relayMessage(m.chat, msg.message, {
        messageId: msg.key.id,
        additionalNodes: ${toCodeObject(additionalNodes)}
    })

    await EliteProTech.sendMessage(m.chat, {
        react: { text: '✅', key: m.key }
    })
} catch (error) {
    await m.reply(String(error.stack || error))
}`

        await m.reply(fullCodeText)
    } catch (error) {
        console.error('CRM error:', error)
        await m.reply(`CRM error: ${error.message || String(error)}`)
    }
}

handler.command = ['crm', 'getmsg', 'msgcode']
handler.owner = true
handler.silentDeny = true

export default handler
