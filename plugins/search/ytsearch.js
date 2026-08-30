import yts from 'yt-search'

let handler = async (m, { EliteProTech, text }) => {
    const query = text.trim()
    if (!query) {
        return await m.reply(`Usage: ${global.prefix || ''}yts <search term>`)
    }

    let results
    try {
        const search = await yts(query)
        results = search.videos.slice(0, 10)
    } catch (error) {
        return await m.reply(`Search failed: ${error.message || String(error)}`)
    }

    if (!results.length) {
        return await m.reply(`No results found for "${query}".`)
    }

    const lines = results.map((video, index) =>
        `${index + 1}. *${video.title}*\nChannel: ${video.author.name} | Duration: ${video.timestamp || 'Live'} | Views: ${video.views.toLocaleString()}\n${video.url}`
    )

    const caption = `*YouTube results for:* ${query}\n\n${lines.join('\n\n')}`
    const thumbnail = results[0].thumbnail

    try {
        if (thumbnail) {
            await EliteProTech.sendMessage(m.chat, {
                image: { url: thumbnail },
                caption
            }, { quoted: m })
        } else {
            await m.reply(caption)
        }
    } catch {
        await m.reply(caption)
    }
}

handler.command = ['yts', 'ytsearch']

export default handler
