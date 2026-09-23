import { generateWAMessageContent } from '@whiskeysockets/baileys'

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

const MEDIA_TYPES = new Set([
    'imageMessage',
    'videoMessage',
    'audioMessage'
])

const hexToArgb = hex => {
    if (!hex) return undefined

    hex = hex.replace('#', '')

    if (hex.length === 3) {
        hex = hex
            .split('')
            .map(c => c + c)
            .join('')
    }

    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)

    return (
        ((0xFF << 24) |
        (r << 16) |
        (g << 8) |
        b) >>> 0
    )
}

const parseTextAndColor = input => {
    const [text, colorName] = String(input || '')
        .split(/,(.+)/)
        .map(value => value?.trim())

    return {
        text,
        color: COLORS[colorName?.toLowerCase()]
    }
}

const groupStatus = async (EliteProTech, jid, content) => {
    const {
        backgroundColor,
        font
    } = content

    delete content.backgroundColor
    delete content.font

    const inside = await generateWAMessageContent(
        content,
        {
            upload: EliteProTech.waUploadToServer
        }
    )

    const messageType = Object.keys(inside)[0]

    if (!messageType || !inside[messageType]) {
        throw new Error('Unable to generate message content.')
    }

    const groupStatusContext = {
        featureEligibilities: {
            canReceiveMultiReact: true
        },
        statusSourceType: 4,
        statusAttributions: [
            {
                type: 10
            }
        ],
        isGroupStatus: true,
        statusAudienceMetadata: {
            audienceType: 1
        }
    }

    inside[messageType].contextInfo = {
        ...(inside[messageType].contextInfo || {}),
        ...groupStatusContext
    }

    if (messageType === 'extendedTextMessage') {
        if (backgroundColor !== undefined) {
            inside[messageType].backgroundArgb = backgroundColor
        }

        inside[messageType].textArgb = 0xFFFFFFFF
        inside[messageType].font = font || 5
        inside[messageType].previewType = 0
        inside[messageType].inviteLinkGroupTypeV2 = 0
    }

    await EliteProTech.relayMessage(
        jid,
        inside,
        {}
    )

    return true
}

let handler = async (m, { text, EliteProTech }) => {
    const quoted = m.quoted

    const hasMedia = MEDIA_TYPES.has(
        quoted?.mtype
    )

    const {
        text: statusText,
        color
    } = parseTextAndColor(text)

    if (!hasMedia && !statusText) {
        return await m.reply(
            `Send text or reply to an image, video, or audio.\n\n` +
            `Examples:\n` +
            `${global.prefix || ''}groupstatus Hello everyone\n` +
            `${global.prefix || ''}groupstatus Hello everyone,blue\n\n` +
            `Colors: ${Object.keys(COLORS).join(', ')}`
        )
    }

    try {
        if (hasMedia) {
            const media = await quoted.download()

            if (!media) {
                throw new Error(
                    'Unable to download the quoted media.'
                )
            }

            const caption =
                quoted.text ||
                quoted.caption ||
                ''

            if (quoted.mtype === 'imageMessage') {
                await groupStatus(
                    EliteProTech,
                    m.chat,
                    {
                        image: media,
                        caption
                    }
                )
            } else if (quoted.mtype === 'videoMessage') {
                await groupStatus(
                    EliteProTech,
                    m.chat,
                    {
                        video: media,
                        caption
                    }
                )
            } else if (quoted.mtype === 'audioMessage') {
                await groupStatus(
                    EliteProTech,
                    m.chat,
                    {
                        audio: media,
                        mimetype:
                            quoted.mimetype ||
                            'audio/mpeg',
                        ptt: Boolean(
                            quoted.msg?.ptt
                        )
                    }
                )
            }
        } else {
            await groupStatus(
                EliteProTech,
                m.chat,
                {
                    text: statusText,
                    backgroundColor:
                        color ??
                        (
                            0xFF000000 +
                            Math.floor(
                                Math.random() *
                                0xFFFFFF
                            )
                        ),
                    font: 5
                }
            )
        }

        await EliteProTech.sendMessage(
            m.chat,
            {
                react: {
                    text: '✅',
                    key: m.key
                }
            }
        )
    } catch (error) {
        console.error(
            '[GROUPSTATUS]',
            error
        )

        await m.reply(
            `Unable to send group status: ${
                error.message || String(error)
            }`
        )
    }
}

handler.command = [
    'groupstatus',
    'gcstatus'
]

handler.group = true
handler.owner = true

export default handler
