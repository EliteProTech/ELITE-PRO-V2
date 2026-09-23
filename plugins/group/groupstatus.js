import { generateWAMessageContent } from '@whiskeysockets/baileys'

const COLORS = {
    green: 0xFF25D366,
    red: 0xFFFF0000,
    blue: 0xFF0000FF,
    yellow: 0xFFFFFF00,
    purple: 0xFF800080,
    black: 0xFF000000,
    white: 0xFFFFFFFF,
    orange: 0xFFFFA500,
    pink: 0xFFFF69B4,
    cyan: 0xFF00FFFF,
    lime: 0xFF00FF00,
    gold: 0xFFFFD700,
    brown: 0xFFA52A2A,
    gray: 0xFF808080,
    silver: 0xFFC0C0C0,
    navy: 0xFF000080,
    teal: 0xFF008080,
    violet: 0xFFEE82EE,
    indigo: 0xFF4B0082
}

const MEDIA_TYPES = new Set([
    'imageMessage',
    'videoMessage',
    'audioMessage'
])

const hexToArgb = hex => {
    if (!hex) return undefined

    hex = hex.replace('#', '').trim()

    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('')
    }

    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
        return undefined
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
    const value = String(input || '').trim()

    const parts = value.split(',')

    const text = parts.shift()?.trim() || ''

    const colorName = parts.join(',').trim().toLowerCase()

    const color =
        COLORS[colorName] ??
        hexToArgb(colorName)

    return {
        text,
        color
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
            `${global.prefix || ''}groupstatus Hello everyone,blue\n` +
            `${global.prefix || ''}groupstatus Hello everyone,#FF1493\n\n` +
            `Colors:\n` +
            `${Object.keys(COLORS).join(', ')}\n\n` +
            `You can also use HEX colors:\n` +
            `#FF1493`
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
            }

            else if (quoted.mtype === 'videoMessage') {
                await groupStatus(
                    EliteProTech,
                    m.chat,
                    {
                        video: media,
                        caption
                    }
                )
            }

            else if (quoted.mtype === 'audioMessage') {
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

            return
        }

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
