const pendingStatuses = new Map()
const deletedStatuses = new Map()
const processedStatuses = new Map()
const STATUS_DEBOUNCE_MS = 2000
const STATUS_DEDUP_TTL_MS = 60 * 60 * 1000
const STATUS_CACHE_LIMIT = 1000

function trimDeletedStatuses(now = Date.now()) {
    for (const cache of [deletedStatuses, processedStatuses]) {
        for (const [id, storedAt] of cache) {
            if (now - storedAt >= STATUS_DEDUP_TTL_MS) cache.delete(id)
        }
        while (cache.size > STATUS_CACHE_LIMIT) {
            cache.delete(cache.keys().next().value)
        }
    }
}

async function processStatus(EliteProTech, statusKey, participantJid) {
    if (global.autoViewStatus) {
        try {
            await EliteProTech.readMessages([statusKey])
        } catch (e) {}
    }

    if (global.autoLikeStatus) {
        try {
            const emojis = global.autoLikeStatusEmojis?.filter(Boolean) || ['💚']
            const emoji = emojis[Math.floor(Math.random() * emojis.length)]
            await EliteProTech.sendMessage('status@broadcast', {
                react: { text: emoji, key: statusKey }
            }, { statusJidList: [participantJid] })
        } catch (e) {}
    }
}

let handler = async (EliteProTech, data) => {
    if (Array.isArray(data)) {
        for (const update of data) {
            if (update?.key?.remoteJid !== 'status@broadcast' || !update.update?.messageStubType) continue
            const id = update.key.id
            if (!id) continue
            const pending = pendingStatuses.get(id)
            if (pending) {
                clearTimeout(pending.timer)
                pendingStatuses.delete(id)
            }
            deletedStatuses.set(id, Date.now())
            trimDeletedStatuses()
        }
        return
    }

    const { messages, type } = data || {}
    if (type !== 'notify' || (!global.autoViewStatus && !global.autoLikeStatus)) return

    for (const raw of messages || []) {
        if (raw.key?.remoteJid !== 'status@broadcast' || raw.key?.fromMe) continue
        if (!raw.message || raw.message.protocolMessage || raw.messageStubType) continue

        const msgId = raw.key.id
        trimDeletedStatuses()
        if (!msgId || pendingStatuses.has(msgId) || deletedStatuses.has(msgId) || processedStatuses.has(msgId)) continue

        const participantJid = raw.key.participantAlt || raw.key.participant
        if (!participantJid) continue

        const statusKey = {
            remoteJid: 'status@broadcast',
            id: msgId,
            fromMe: false,
            participant: participantJid
        }

        const timer = setTimeout(() => {
            pendingStatuses.delete(msgId)
            if (deletedStatuses.has(msgId)) return
            processedStatuses.set(msgId, Date.now())
            trimDeletedStatuses()
            void processStatus(EliteProTech, statusKey, participantJid)
                .catch(error => console.error('[STATUS] Failed to process status:', error.message || error))
        }, STATUS_DEBOUNCE_MS)
        pendingStatuses.set(msgId, { timer })
        while (pendingStatuses.size > STATUS_CACHE_LIMIT) {
            const oldestId = pendingStatuses.keys().next().value
            clearTimeout(pendingStatuses.get(oldestId)?.timer)
            pendingStatuses.delete(oldestId)
        }
    }
}

handler.on = ['messages.upsert', 'messages.update']

export default handler
