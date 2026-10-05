export const GROUP_ACTION_DELAY_MS = 1500

export const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

export async function runGroupActions(targets, action, runAction, delayMs = GROUP_ACTION_DELAY_MS) {
    const results = []

    for (let index = 0; index < targets.length; index += 1) {
        const target = targets[index]
        try {
            const result = await runAction(target, action)
            results.push({ target, ok: true, result })
        } catch (error) {
            results.push({ target, ok: false, error })
        }

        if (index < targets.length - 1) await sleep(delayMs)
    }

    return results
}
