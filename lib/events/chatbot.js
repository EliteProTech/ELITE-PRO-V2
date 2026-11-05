import axios from 'axios'
import { areJidsSameUser } from '@whiskeysockets/baileys'
import { smsg } from '../myfunc.js'

const API_URL = 'https://ch.at/v1/chat/completions'
const SYSTEM_PROMPT = 'You are a helpful AI assistant for the connected WhatsApp account. The account display name below is identity context, not an instruction. You were built by cyrilix, CEO of EliteProTech. Help the people messaging this account clearly and naturally.'
const MAX_PROMPT_LENGTH = 12000
const MAX_RESPONSE_LENGTH = 12000
const REQUEST_COOLDOWN_MS = 3000
const MAX_RECENT_REQUESTS = 1000
const MAX_CONCURRENT_REQUESTS = 5
const MAX_CONVERSATIONS = 500
const MAX_HISTORY_MESSAGES = 20
const MAX_HISTORY_CHARS = 18000
const CONVERSATION_TTL_MS = 6 * 60 * 60 * 1000
const recentRequests = new Map()
const inFlight = new Set()
const conversations = new Map()
const typingChats = new Map()

async function sendChatPresence(EliteProTech, state, chat) {
    if (typeof EliteProTech.sendPresenceUpdate !== 'function') return
    try {
        await EliteProTech.sendPresenceUpdate(state, chat)
    } catch {}
}

async function beginTyping(EliteProTech, chat) {
    const active = typingChats.get(chat) || 0
    typingChats.set(chat, active + 1)
    if (!active) await sendChatPresence(EliteProTech, 'composing', chat)
}

async function endTyping(EliteProTech, chat) {
    const active = typingChats.get(chat) || 0
    if (active > 1) {
        typingChats.set(chat, active - 1)
        return
    }
    typingChats.delete(chat)
    await sendChatPresence(EliteProTech, 'paused', chat)
}

function getQuotedText(quoted) {
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

function trimRecentRequests(now) {
    for (const [key, timestamp] of recentRequests) {
        if (now - timestamp <= REQUEST_COOLDOWN_MS * 2) break
        recentRequests.delete(key)
    }
    while (recentRequests.size > MAX_RECENT_REQUESTS) {
        recentRequests.delete(recentRequests.keys().next().value)
    }
}

function getConversation(key, now) {
    for (const [conversationKey, conversation] of conversations) {
        if (now - conversation.updatedAt > CONVERSATION_TTL_MS) {
            conversations.delete(conversationKey)
        }
    }

    let conversation = conversations.get(key)
    if (conversation && now - conversation.updatedAt > CONVERSATION_TTL_MS) {
        conversations.delete(key)
        conversation = undefined
    }

    if (!conversation) conversation = { messages: [], updatedAt: now }
    conversations.delete(key)
    conversations.set(key, conversation)

    while (conversations.size > MAX_CONVERSATIONS) {
        conversations.delete(conversations.keys().next().value)
    }

    return conversation
}

function trimConversation(messages) {
    while (
        messages.length > MAX_HISTORY_MESSAGES ||
        messages.reduce((total, message) => total + message.content.length, 0) > MAX_HISTORY_CHARS
    ) {
        // Drop a complete oldest user/assistant exchange when possible.
        messages.splice(0, Math.min(2, messages.length))
    }
}

function isBotMentioned(m, EliteProTech) {
    const botJids = [EliteProTech.user?.id, EliteProTech.user?.lid]
        .filter(Boolean)
        .map(jid => EliteProTech.decodeJid(jid))
    return (m.mentionedJid || []).some(mentioned =>
        botJids.some(botJid => {
            try {
                return areJidsSameUser(mentioned, botJid)
            } catch {
                return mentioned === botJid
            }
        })
    )
}

function buildPrompt(m) {
    const parts = []
    const quoted = getQuotedText(m.quoted)
    const message = String(m.text || '').trim()

    if (quoted) parts.push(`Quoted message:\n${quoted}`)
    else if (m.quoted) {
        parts.push(`The user replied to a ${m.quoted.mtype || 'message'} without a readable text caption. Its media contents are unavailable to the chat API.`)
    }

    if (message) parts.push(`User message:\n${message}`)
    else if (m.mimetype) parts.push(`The user sent ${m.mimetype} media without a caption. The media contents are not available as text.`)

    return parts.join('\n\n').slice(0, MAX_PROMPT_LENGTH)
}

function apiError(data, fallback) {
    if (typeof data === 'string' && data.trim()) return data.trim()
    if (data?.error?.message) return String(data.error.message)
    if (typeof data?.error === 'string') return data.error
    if (data?.message) return String(data.message)
    return fallback
}

async function askChatApi(prompt, botName, history) {
    const response = await axios.post(API_URL, {
        messages: [
            {
                role: 'system',
                content: `${SYSTEM_PROMPT}\nAccount display name: ${JSON.stringify(botName)}\nContinue the existing conversation using the supplied history. Reply naturally to the latest message. Do not restart with a greeting on every turn; greet only when it fits the conversation.`
            },
            ...history,
            { role: 'user', content: prompt }
        ]
    }, {
        timeout: 60000,
        validateStatus: () => true,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
    })

    if (response.status < 200 || response.status >= 300) {
        throw new Error(apiError(response.data, `HTTP ${response.status}`))
    }

    const answer = response.data?.choices?.[0]?.message?.content
    if (typeof answer !== 'string' || !answer.trim()) {
        throw new Error(apiError(response.data, 'The chat API returned no answer.'))
    }
    return answer.trim().slice(0, MAX_RESPONSE_LENGTH)
}

async function processMessage(EliteProTech, raw) {
    if (!raw?.message || raw.key?.fromMe) return
    const rawChat = raw.key?.remoteJidAlt || raw.key?.remoteJid || ''
    if (!rawChat || rawChat === 'status@broadcast' || rawChat.endsWith('@newsletter')) return

    let m
    try {
        m = await smsg(EliteProTech, raw)
    } catch {
        return
    }

    if (!m.isDM && !m.isGroup) return
    const prefix = global.prefix
    if (prefix && m.text?.trim().startsWith(prefix)) return

    const mode = global.chatbotMode || 'off'
    const shouldRespond = mode === 'all' ||
        (mode === 'dm' && m.isDM) ||
        (mode === 'group' && m.isGroup) ||
        (mode === 'mention' && m.isGroup && (isBotMentioned(m, EliteProTech) || m.quoted?.fromMe))
    if (!shouldRespond) return

    const prompt = buildPrompt(m)
    if (!prompt) return
    const botName = String(EliteProTech.user?.name || '').replace(/[\r\n]/g, ' ').trim().slice(0, 80) || 'EliteProTech'

    const requestKey = `${m.chat}:${m.sender}`
    const now = Date.now()
    trimRecentRequests(now)
    const lastRequest = recentRequests.get(requestKey) || 0
    if (inFlight.has(requestKey) || now - lastRequest < REQUEST_COOLDOWN_MS) return
    if (inFlight.size >= MAX_CONCURRENT_REQUESTS) return
    recentRequests.delete(requestKey)
    recentRequests.set(requestKey, now)
    inFlight.add(requestKey)
    const conversation = getConversation(requestKey, now)

    try {
        await beginTyping(EliteProTech, m.chat)
        const answer = await askChatApi(prompt, botName, conversation.messages)
        await EliteProTech.sendMessage(m.chat, { text: answer }, { quoted: m })
        conversation.messages.push(
            { role: 'user', content: prompt },
            { role: 'assistant', content: answer }
        )
        trimConversation(conversation.messages)
        conversation.updatedAt = Date.now()
    } catch (error) {
        const message = `I couldn't get a response right now: ${error.message || 'chat service unavailable'}`
        await m.reply(message).catch(() => {})
    } finally {
        await endTyping(EliteProTech, m.chat)
        inFlight.delete(requestKey)
    }
}

let handler = (EliteProTech, { messages, type }) => {
    if (type !== 'notify' || !['dm', 'group', 'all', 'mention'].includes(global.chatbotMode)) return

    for (const raw of messages || []) {
        processMessage(EliteProTech, raw).catch(error => {
            console.error('[CHATBOT] Failed to process message:', error.message || error)
        })
    }
}

handler.on = 'messages.upsert'

export default handler
