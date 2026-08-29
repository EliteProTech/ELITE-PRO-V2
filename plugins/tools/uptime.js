function formatDuration(seconds) {
    const total = Math.floor(seconds)
    const days = Math.floor(total / 86400)
    const hours = Math.floor((total % 86400) / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const remainingSeconds = total % 60

    return [
        days && `${days}d`,
        hours && `${hours}h`,
        minutes && `${minutes}m`,
        `${remainingSeconds}s`
    ].filter(Boolean).join(' ')
}

let handler = async (m) => {
    await m.reply(`*Runtime:* ${formatDuration(process.uptime())}`)
}

handler.command = ['uptime', 'runtime']

export default handler
