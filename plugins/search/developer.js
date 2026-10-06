import { githubJson, npmJson } from '../../lib/developerdownloads.js'

const trim = (value, length = 180) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim()
    return text.length > length ? `${text.slice(0, length - 1)}…` : text
}

let handler = async (m, { command, text, EliteProTech }) => {
    const query = String(text || '').trim()
    const commandName = String(command || '').toLowerCase()

    if (!query) {
        const usage = commandName.includes('npm')
            ? `${global.prefix || ''}npmsearch <package>`
            : commandName.includes('user')
                ? `${global.prefix || ''}githubuser <username>`
                : `${global.prefix || ''}githubrepo <search term>`
        return await m.reply(`Usage: ${usage}`)
    }

    try {
        if (commandName.includes('user')) {
            const username = query.replace(/^@/, '')
            if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(username)) {
                return await m.reply(`Usage: ${global.prefix || ''}githubuser <username>`)
            }

            const user = await githubJson(`/users/${encodeURIComponent(username)}`)
            const caption = [
                `*GitHub user: ${user.login}*`,
                user.name ? `Name: ${user.name}` : '',
                user.bio ? `Bio: ${trim(user.bio)}` : '',
                `Public repos: ${user.public_repos ?? 0} | Followers: ${user.followers ?? 0}`,
                user.location ? `Location: ${user.location}` : '',
                user.html_url
            ].filter(Boolean).join('\n')

            if (user.avatar_url) {
                return await EliteProTech.sendMessage(m.chat, {
                    image: { url: user.avatar_url },
                    caption
                }, { quoted: m })
            }
            return await m.reply(caption)
        }

        if (commandName.includes('repo')) {
            const result = await githubJson(`/search/repositories?q=${encodeURIComponent(query)}&per_page=5`)
            if (!result.items?.length) return await m.reply(`No GitHub repositories found for "${query}".`)

            const lines = result.items.map((repo, index) => [
                `${index + 1}. *${repo.full_name}*`,
                repo.description ? trim(repo.description) : 'No description.',
                `★ ${repo.stargazers_count ?? 0} | ${repo.language || 'Unknown language'}`,
                repo.html_url
            ].join('\n'))
            return await m.reply(`*GitHub repositories for:* ${query}\n\n${lines.join('\n\n')}`)
        }

        const result = await npmJson(`/-/v1/search?text=${encodeURIComponent(query)}&size=5`)
        if (!result.objects?.length) return await m.reply(`No npm packages found for "${query}".`)

        const lines = result.objects.map(({ package: pkg }, index) => [
            `${index + 1}. *${pkg.name}* v${pkg.version || 'unknown'}`,
            pkg.description ? trim(pkg.description) : 'No description.',
            pkg.links?.npm || `https://www.npmjs.com/package/${pkg.name}`
        ].join('\n'))
        return await m.reply(`*npm packages for:* ${query}\n\n${lines.join('\n\n')}`)
    } catch (error) {
        const source = commandName.includes('npm') ? 'npm' : 'GitHub'
        return await m.reply(`${source} search failed: ${error.message || String(error)}`)
    }
}

handler.command = ['githubuser', 'ghuser', 'githubrepo', 'ghrepo', 'npmsearch', 'npm']

export default handler
