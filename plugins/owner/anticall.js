import { getAntiCallSettings, setAntiCallSettings } from '../../lib/anticall.js'

const usage = prefix => `*Anti-call Settings*\n\nCurrent: *${getAntiCallSettings().action}* for *${getAntiCallSettings().scope}*\n\n${prefix}anticall off\n${prefix}anticall decline|block all|dm|group\n${prefix}anticall decline|block number <number>\n${prefix}anticall decline|block selectedgroup\n${prefix}anticall remove number <number>\n${prefix}anticall remove group\n${prefix}anticall status`

const getNumber = value => String(value || '').replace(/\D/g, '')

let handler = async (m, { args }) => {
    const prefix = global.prefix || ''
    const action = args[0]?.toLowerCase()
    const target = args[1]?.toLowerCase()

    if (!action || action === 'status') {
        const settings = getAntiCallSettings()
        const numbers = settings.numbers.length ? settings.numbers.map(number => `• ${number}`).join('\n') : '• None'
        const groups = settings.groups.length ? settings.groups.map(group => `• ${group}`).join('\n') : '• None'
        return await m.reply(`${usage(prefix)}\n\n*Selected numbers*\n${numbers}\n\n*Selected groups*\n${groups}`)
    }

    if (action === 'off') {
        setAntiCallSettings({ action: 'off' })
        return await m.reply('Anti-call turned *off*.')
    }

    if (action === 'remove') {
        const settings = getAntiCallSettings()
        if (target === 'number') {
            const number = getNumber(args[2])
            if (!number) return await m.reply(`Usage: ${prefix}anticall remove number <number>`)
            setAntiCallSettings({ numbers: settings.numbers.filter(item => item !== number) })
            return await m.reply(`Removed *${number}* from selected numbers.`)
        }
        if (target === 'group') {
            if (!m.isGroup) return await m.reply('Use this command inside the group you want to remove.')
            setAntiCallSettings({ groups: settings.groups.filter(group => group !== m.chat) })
            return await m.reply('This group was removed from selected groups.')
        }
        return await m.reply(`Usage: ${prefix}anticall remove number <number> | ${prefix}anticall remove group`)
    }

    if (!['decline', 'block'].includes(action)) return await m.reply(usage(prefix))
    if (['all', 'dm', 'group'].includes(target)) {
        setAntiCallSettings({ action, scope: target })
        return await m.reply(`Anti-call will *${action}* calls from *${target}*.`)
    }

    if (target === 'number' || target === 'selectednumber') {
        const number = getNumber(args[2])
        if (!number) return await m.reply(`Usage: ${prefix}anticall ${action} number <number>`)
        const settings = getAntiCallSettings()
        const numbers = [...new Set([...settings.numbers, number])]
        setAntiCallSettings({ action, scope: 'selectednumber', numbers })
        return await m.reply(`Anti-call will *${action}* calls from *${number}*.`)
    }

    if (target === 'selectedgroup') {
        if (!m.isGroup) return await m.reply('Use this command inside the group you want to select.')
        const settings = getAntiCallSettings()
        const groups = [...new Set([...settings.groups, m.chat])]
        setAntiCallSettings({ action, scope: 'selectedgroup', groups })
        return await m.reply(`Anti-call will *${action}* calls from this selected group.`)
    }

    await m.reply(usage(prefix))
}

handler.command = ['anticall']
handler.owner = true

export default handler
