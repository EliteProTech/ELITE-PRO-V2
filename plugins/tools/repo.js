import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const REPO_URL = 'https://github.com/EliteProTech/ELITE-PRO-V2'
const REPO_API_URL = 'https://api.github.com/repos/EliteProTech/ELITE-PRO-V2'
const REPO_PREVIEW_URL = 'https://opengraph.githubassets.com/1/EliteProTech/ELITE-PRO-V2'
const FALLBACK_IMAGE_PATH = fileURLToPath(new URL('../../lib/elitepropic.jpg', import.meta.url))

async function getRepoPreview() {
    try {
        const response = await axios.get(REPO_PREVIEW_URL, {
            responseType: 'arraybuffer',
            timeout: 8000,
            maxContentLength: 8 * 1024 * 1024,
            maxBodyLength: 8 * 1024 * 1024
        })
        const contentType = String(response.headers['content-type'] || '')
        if (contentType.startsWith('image/')) return Buffer.from(response.data)
    } catch {}

    return fs.readFileSync(FALLBACK_IMAGE_PATH)
}

let handler = async (m, { EliteProTech }) => {
    const [statsResult, imageResult] = await Promise.allSettled([
        axios.get(REPO_API_URL, {
            timeout: 5000,
            headers: {
                Accept: 'application/vnd.github+json',
                'User-Agent': 'ELITE-PRO-V2-WhatsApp-Bot'
            }
        }),
        getRepoPreview()
    ])

    const data = statsResult.status === 'fulfilled' ? statsResult.value.data : null
    const stars = Number.isFinite(data?.stargazers_count) ? data.stargazers_count : null
    const forks = Number.isFinite(data?.forks_count) ? data.forks_count : null
    const image = imageResult.status === 'fulfilled'
        ? imageResult.value
        : fs.readFileSync(FALLBACK_IMAGE_PATH)

    const counts = stars !== null && forks !== null
        ? `⭐ Stars: ${stars.toLocaleString()}\n🍴 Forks: ${forks.toLocaleString()}`
        : '⭐ Stars and forks: unavailable right now'

    const text = `*ELITE-PRO-V2 Official Repo*\n\n` +
        `GitHub: ${REPO_URL}\n\n` +
        `${counts}\n\n` +
        `Please fork and star the repo. Your support keeps the bot alive.\n\n` +
        `*Deploy in 2 mins:* Fork, Star, Deploy, Pair to WhatsApp.\n\n` +
        `*ELITE-PRO-V2 | TEAM*`

    await EliteProTech.sendMessage(m.chat, { image, caption: text }, { quoted: m })
}

handler.command = ['repo']
handler.category = 'Tools'

export default handler
