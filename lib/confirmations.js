const confirmationKey = (chat, sender) => `${chat}:${sender}`
const MAX_CONFIRMATIONS = 100

export async function requestReplyConfirmation(EliteProTech, m, {
    text,
    execute,
    requirements = {},
    ttl = 60_000
}) {
    const confirmations = global.replyConfirmations ??= new Map()
    const now = Date.now()
    for (const [key, pending] of confirmations) {
        if (pending.expiresAt <= now) confirmations.delete(key)
    }

    const sent = await EliteProTech.sendMessage(m.chat, { text }, { quoted: m })
    const key = confirmationKey(m.chat, m.sender)
    const pending = {
        messageId: sent.key.id,
        expiresAt: now + ttl,
        execute,
        requirements
    }
    confirmations.delete(key)
    confirmations.set(key, pending)
    while (confirmations.size > MAX_CONFIRMATIONS) {
        confirmations.delete(confirmations.keys().next().value)
    }

    setTimeout(() => {
        if (confirmations.get(key) === pending) confirmations.delete(key)
    }, ttl)

    return sent
}
