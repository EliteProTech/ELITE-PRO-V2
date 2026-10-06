import axios from 'axios'

const API_URL = 'https://eliteprotech-apis.zone.id/ai/deepseekai'

const apiError = (data, fallback) => {
    if (typeof data === 'string' && data.trim()) return data.trim()
    if (data?.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
    if (data?.message) return String(data.message)
    return fallback
}

const quotedText = quoted => {
    if (!quoted) return ''
    return String(
        quoted.text ||
        quoted.caption ||
        quoted.msg?.text ||
        quoted.msg?.caption ||
        quoted.msg?.conversation ||
        quoted.message?.conversation ||
        ''
    ).trim()
}

let handler = async (m, { text, EliteProTech }) => {
    const instruction = String(text || '').trim()
    const quoted = quotedText(m.quoted)
    const prompt = quoted
        ? instruction
            ? `${instruction}\n\n${quoted}`
            : quoted
        : instruction

    if (!prompt) {
        return await m.reply(`Usage: ${global.prefix || ''}ai <your question>\nOr reply to a text/caption and use ${global.prefix || ''}ai [instruction].`)
    }
    if (prompt.length > 16000) {
        return await m.reply('The prompt is too long. Please use a shorter message.')
    }

    const editKey = m.fromMe
        ? m.key
        : (await EliteProTech.sendMessage(m.chat, {
            text: `✦ Generating response @${m.sender.split('@')[0]}...`,
            mentions: [m.sender]
        }, { quoted: m })).key

    const finish = output => EliteProTech.sendMessage(m.chat, {
        text: output,
        edit: editKey
    })

    try {
        const response = await axios.get(API_URL, {
            params: { prompt },
            timeout: 90000,
            validateStatus: () => true,
            headers: { Accept: 'application/json' }
        })

        const data = response.data
        if (response.status < 200 || response.status >= 300 || data?.success === false) {
            return await finish(`AI request failed: ${apiError(data, `HTTP ${response.status}`)}`)
        }

        const answer = typeof data?.response === 'string' ? data.response.trim() : ''
        if (!answer) {
            return await finish(`AI request failed: ${apiError(data, 'The API returned no response text.')}`)
        }

        return await finish(answer)
    } catch (error) {
        const data = error.response?.data
        return await finish(`AI request failed: ${apiError(data, error.message || 'Unable to reach the AI API.')}`)
    }
}

handler.command = ['ai', 'deepseek']

export default handler
