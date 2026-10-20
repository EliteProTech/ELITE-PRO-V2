import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

const MAX_EXPORT_BYTES = 5 * 1024 * 1024

function containsField(value, wanted, depth = 0, visited = new WeakSet()) {
    if (!value || typeof value !== 'object' || depth > 30 || visited.has(value)) return false
    visited.add(value)
    if (Object.hasOwn(value, wanted) && value[wanted] != null) return true
    return Object.values(value).some(child => containsField(child, wanted, depth + 1, visited))
}

function makeRelayNodes(message, chat) {
    const nodes = []
    const has = name => containsField(message, name)

    if (has('buttonsMessage') || has('interactiveMessage') || has('carouselMessage')) {
        nodes.push({
            tag: 'biz',
            attrs: {},
            content: [{
                tag: 'interactive',
                attrs: { type: 'native_flow', v: '1' },
                content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
            }]
        })
    }

    if (has('listMessage')) {
        nodes.push({
            tag: 'biz',
            attrs: {},
            content: [{ tag: 'list', attrs: { v: '2', type: 'product_list' } }]
        })
    }

    if (nodes.length && !chat.endsWith('@g.us')) {
        nodes.push({ tag: 'bot', attrs: { biz_bot: '1' } })
    }

    return nodes
}

function makeExportSource(payload, relayNodes, source) {
    return [
        '// ELITE-PRO MESSAGE EXPORT v1',
        `export const source = ${JSON.stringify(source)};`,
        `export const payloadObject = ${JSON.stringify(payload, null, 2)};`,
        `export const relayNodes = ${JSON.stringify(relayNodes, null, 2)};`,
        ''
    ].join('\n')
}

function readExport(sourceText) {
    if (!sourceText.startsWith('// ELITE-PRO MESSAGE EXPORT v1')) {
        throw new Error('That is not an export created by .getmsg.')
    }

    const sourceMatch = sourceText.match(/export const source = (\{[^;]*\});/s)
    const payloadMatch = sourceText.match(/export const payloadObject = ([\s\S]*?);\r?\nexport const relayNodes = /)
    const relayMatch = sourceText.match(/export const relayNodes = ([\s\S]*?);\s*$/)
    if (!sourceMatch || !payloadMatch || !relayMatch) {
        throw new Error('The export file is incomplete or was edited.')
    }

    return {
        source: JSON.parse(sourceMatch[1]),
        payloadObject: JSON.parse(payloadMatch[1]),
        relayNodes: JSON.parse(relayMatch[1])
    }
}

let handler = async (m, { EliteProTech, command }) => {
    try {
        if (command === 'try') {
            const quoted = m.quoted
            if (quoted?.mtype !== 'documentMessage') {
                return await m.reply('Reply to a JavaScript document created by .getmsg with .try.')
            }

            const file = await quoted.download()
            if (!file?.length || file.length > MAX_EXPORT_BYTES) {
                return await m.reply('The export file is empty or exceeds the 5 MB limit.')
            }

            const exported = readExport(file.toString('utf8'))
            if (exported.source?.fromMe !== true) {
                return await m.reply('For safety, .try only re-sends messages originally sent by this bot. Use .getmsg on one of your bot’s messages.')
            }
            if (!exported.payloadObject || typeof exported.payloadObject !== 'object') {
                return await m.reply('The export does not contain a valid message payload.')
            }
            if (containsField(exported.payloadObject, 'protocolMessage')) {
                return await m.reply('Protocol-control messages cannot be re-sent.')
            }
            if (containsField(exported.payloadObject, 'verificationMetadata')) {
                return await m.reply('Messages containing WhatsApp verification metadata cannot be re-sent.')
            }

            const content = proto.Message.fromObject(exported.payloadObject)
            const outgoing = generateWAMessageFromContent(m.chat, content, {
                userJid: EliteProTech.user.id,
                quoted: m
            })

            await EliteProTech.relayMessage(m.chat, outgoing.message, {
                messageId: outgoing.key.id,
                additionalNodes: Array.isArray(exported.relayNodes) ? exported.relayNodes : []
            })
            return await EliteProTech.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            })
        }

        const quoted = m.quoted
        if (!quoted) return await m.reply('Reply to the message you want to export with .getmsg.')

        const key = quoted.fakeObj?.key
        const original = EliteProTech.getStoredMessage?.(key) || quoted.rawMessage || quoted.fakeObj?.rawMessage || quoted.message || quoted.fakeObj?.message
        if (!original) return await m.reply('Quoted message data is unavailable in the message cache.')

        const payloadObject = proto.Message.toObject(proto.Message.fromObject(original), {
            enums: Number,
            longs: String,
            bytes: String,
            defaults: false,
            arrays: true,
            objects: true,
            oneofs: true
        })

        if (containsField(payloadObject, 'protocolMessage')) {
            return await m.reply('Protocol-control messages cannot be exported.')
        }
        if (containsField(payloadObject, 'verificationMetadata')) {
            return await m.reply('Messages containing WhatsApp verification metadata cannot be exported.')
        }

        const source = {
            fromMe: key?.fromMe === true,
            chat: key?.remoteJid || m.chat,
            messageId: key?.id || null
        }
        const relayNodes = makeRelayNodes(payloadObject, m.chat)
        const output = Buffer.from(makeExportSource(payloadObject, relayNodes, source), 'utf8')
        if (output.length > MAX_EXPORT_BYTES) {
            return await m.reply('That message is too large to export (maximum 5 MB).')
        }

        return await EliteProTech.sendMessage(m.chat, {
            document: output,
            mimetype: 'text/javascript',
            fileName: `message-${key?.id || Date.now()}.js`
        }, { quoted: m })
    } catch (error) {
        console.error(`[${command === 'try' ? 'TRY' : 'GETMSG'}]`, error)
        return await m.reply(`${command === 'try' ? 'Could not re-send export' : 'Could not export message'}: ${error.message || String(error)}`)
    }
}

handler.command = ['crm', 'getmsg', 'msgcode', 'try']
handler.owner = true
handler.silentDeny = true

export default handler
