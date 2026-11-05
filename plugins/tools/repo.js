import axios from 'axios'

const REPO_URL = 'https://github.com/EliteProTech/ELITE-PRO-V2'
const REPO_API_URL = 'https://api.github.com/repos/EliteProTech/ELITE-PRO-V2'
const REPO_PREVIEW_URL = 'https://opengraph.githubassets.com/1/EliteProTech/ELITE-PRO-V2'

let handler = async (m, { EliteProTech }) => {
    let stars = null
    let forks = null

    try {
        const { data } = await axios.get(REPO_API_URL, {
            timeout: 5000,
            headers: {
                Accept: 'application/vnd.github+json',
                'User-Agent': 'ELITE-PRO-V2-WhatsApp-Bot'
            }
        })

        if (Number.isFinite(data?.stargazers_count)) stars = data.stargazers_count
        if (Number.isFinite(data?.forks_count)) forks = data.forks_count
    } catch {}

    const counts = stars !== null && forks !== null
        ? `⭐ Stars: ${stars.toLocaleString()}\n🍴 Forks: ${forks.toLocaleString()}`
        : '⭐ Stars and forks: unavailable right now'

    const text = `*ELITE-PRO-V2 Official Repo*\n\n` +
        `GitHub: ${REPO_URL}\n\n` +
        `${counts}\n\n` +
        `Please fork and star the repo. Your support keeps the bot alive.\n\n` +
        `*Deploy in 2 mins:* Fork, Star, Deploy, Pair to WhatsApp.\n\n` +
        `*ELITE-PRO-V2 | TEAM*`

    await EliteProTech.sendMessage(m.chat, {
        text,
        contextInfo: {
            externalAdReply: {
                title: 'ELITE-PRO-V2 Official Repo',
                body: stars !== null && forks !== null
                    ? `⭐ ${stars.toLocaleString()} Stars  •  🍴 ${forks.toLocaleString()} Forks`
                    : 'Fork, star, deploy, and pair to WhatsApp',
                mediaType: 1,
                sourceUrl: REPO_URL,
                thumbnailUrl: REPO_PREVIEW_URL,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.command = ['repo']
handler.category = 'Tools'

export default handler
