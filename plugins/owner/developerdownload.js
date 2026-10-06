import {
    developerHeaders,
    downloadOfficialFile,
    githubJson,
    npmJson,
    parseGitHubRepository,
    parseNpmSpec
} from '../../lib/developerdownloads.js'

const usage = (command, prefix) => command === 'gitclone'
    ? `${prefix}gitclone <owner/repository> [branch-or-tag]`
    : `${prefix}npmget <package[@version]>`

let handler = async (m, { command, text, EliteProTech }) => {
    const commandName = String(command || '').toLowerCase()
    const input = String(text || '').trim()
    const prefix = global.prefix || ''

    if (!input) return await m.reply(`Usage: ${usage(commandName, prefix)}`)

    try {
        if (commandName === 'gitclone') {
            const [repository, ref] = input.split(/\s+/, 2)
            if (ref && !/^[A-Za-z0-9._/-]{1,160}$/.test(ref)) {
                return await m.reply('Use a valid branch or tag name.')
            }

            const { owner, repo } = parseGitHubRepository(repository)
            const details = await githubJson(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`)
            const version = ref || details.default_branch
            const archiveUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/zipball/${encodeURIComponent(version)}`
            const archive = await downloadOfficialFile(archiveUrl, { headers: developerHeaders })

            return await EliteProTech.sendMessage(m.chat, {
                document: archive,
                mimetype: 'application/zip',
                fileName: `${owner}-${repo}-${version}.zip`,
                caption: `GitHub archive: ${owner}/${repo}@${version}`
            }, { quoted: m })
        }

        const { packageName, version: requestedVersion } = parseNpmSpec(input)
        const metadata = await npmJson(`/${encodeURIComponent(packageName)}`)
        const version = requestedVersion || metadata['dist-tags']?.latest
        const release = metadata.versions?.[version]
        if (!release?.dist?.tarball) {
            throw new Error(`Version "${version || requestedVersion}" was not found for ${packageName}.`)
        }

        const archive = await downloadOfficialFile(release.dist.tarball)
        const safeName = packageName.replace(/^@/, '').replace(/[\\/]/g, '-')
        return await EliteProTech.sendMessage(m.chat, {
            document: archive,
            mimetype: 'application/gzip',
            fileName: `${safeName}-${version}.tgz`,
            caption: `npm package: ${packageName}@${version}`
        }, { quoted: m })
    } catch (error) {
        const source = commandName === 'gitclone' ? 'GitHub archive' : 'npm download'
        return await m.reply(`${source} failed: ${error.message || String(error)}`)
    }
}

handler.command = ['gitclone', 'npmget', 'npmdownload']
handler.owner = true
handler.silentDeny = true

export default handler
