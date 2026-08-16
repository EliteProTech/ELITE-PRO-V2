import readline from 'readline'
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import chalk from 'chalk'
import { fileURLToPath, pathToFileURL } from 'url'
import {
    useMultiFileAuthState,
    DisconnectReason,
    Browsers
} from '@whiskeysockets/baileys'
import { smsg, makeWASocket, bind, sendNotification, getGroupMetadata } from './lib/myfunc.js'
import { suppressSignalLogs } from './lib/filter.js'
import './config.js'

suppressSignalLogs()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pluginDir = path.join(__dirname, 'plugins')
const eventDir = path.join(__dirname, 'lib', 'events')

const settingsPath = path.join(__dirname, 'lib', 'database', 'settings.json')
try {
    const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    if (saved.mode === 'self' || saved.mode === 'public') {
        global.botMode = saved.mode
    }
    if (typeof saved.autoViewStatus === 'boolean') {
        global.autoViewStatus = saved.autoViewStatus
    }
    if (typeof saved.autoLikeStatus === 'boolean') {
        global.autoLikeStatus = saved.autoLikeStatus
    }
} catch {}

export const plugins = new Map()
export const eventHandlers = new Map()

const pluginCache = new Map()
const eventCache = new Map()
const watchers = new Map()
const pendingReloads = new Map()

const readJSON = file => JSON.parse(fs.readFileSync(file))

function getPluginFiles(dir) {
    let files = []
    if (!fs.existsSync(dir)) return files
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, item.name)
        if (item.isDirectory()) files.push(...getPluginFiles(full))
        else if (item.isFile() && item.name.endsWith('.js')) files.push(full)
    }
    return files
}

async function loadPlugin(file) {
    try {
        const module = await import(`${pathToFileURL(file).href}?update=${Date.now()}`)
        const handler = module.default
        if (!handler) return
        if (pluginCache.has(file)) {
            for (const key of pluginCache.get(file)) plugins.delete(key)
        }
        const keys = []
        if (handler.command && !(handler.command instanceof RegExp)) {
            const commands = Array.isArray(handler.command) ? handler.command : [handler.command]
            for (const cmd of commands) {
                const key = String(cmd).toLowerCase()
                plugins.set(key, handler)
                keys.push(key)
            }
        }
        if (handler.customPrefix) {
            const key = Symbol(file)
            plugins.set(key, handler)
            keys.push(key)
        }
        pluginCache.set(file, keys)
        console.log(`[PLUGIN] Loaded ${path.relative(pluginDir, file)}`)
    } catch (e) {
        console.error(`[PLUGIN] Failed ${file}`)
        console.error(e)
    }
}

async function unloadPlugin(file) {
    if (!pluginCache.has(file)) return
    for (const key of pluginCache.get(file)) plugins.delete(key)
    pluginCache.delete(file)
    console.log(`[PLUGIN] Unloaded ${path.relative(pluginDir, file)}`)
}

export async function initPlugins() {
    for (const file of getPluginFiles(pluginDir)) {
        await loadPlugin(file)
    }
    watch(pluginDir, loadPlugin, unloadPlugin)
}

async function loadEventFile(file) {
    try {
        const module = await import(`${pathToFileURL(file).href}?update=${Date.now()}`)
        const handler = module.default
        if (!handler || !handler.on) return
        eventHandlers.set(file, handler)
        eventCache.set(file, true)
        console.log(`[EVENT] Loaded ${path.relative(eventDir, file)}`)
    } catch (e) {
        console.error(`[EVENT] Failed ${file}`)
        console.error(e)
    }
}

async function unloadEventFile(file) {
    if (!eventCache.has(file)) return
    eventHandlers.delete(file)
    eventCache.delete(file)
    console.log(`[EVENT] Unloaded ${path.relative(eventDir, file)}`)
}

export async function initEvents() {
    for (const file of getPluginFiles(eventDir)) {
        await loadEventFile(file)
    }
    watch(eventDir, loadEventFile, unloadEventFile)
}

const wiredEventNames = new Set()

function handlerEventNames(handler) {
    if (!handler.on) return []
    return Array.isArray(handler.on) ? handler.on : [handler.on]
}

export function wireEventDispatchers(EliteProTech) {
    wiredEventNames.clear()
    const names = new Set([...eventHandlers.values()].flatMap(handlerEventNames))
    for (const name of names) {
        if (wiredEventNames.has(name)) continue
        wiredEventNames.add(name)
        EliteProTech.ev.on(name, async (data) => {
            for (const handler of eventHandlers.values()) {
                if (!handlerEventNames(handler).includes(name)) continue
                try {
                    await handler(EliteProTech, data)
                } catch (e) {
                    console.error(`[EVENT] Error in handler for ${name}:`, e)
                }
            }
        })
    }
}

function watch(dir, loadFn, unloadFn) {
    if (watchers.has(dir)) return
    watchers.set(dir, fs.watch(dir, (_, filename) => {
        if (!filename || !filename.endsWith('.js')) return
        const file = path.join(dir, filename)
        if (pendingReloads.has(file)) clearTimeout(pendingReloads.get(file))
        pendingReloads.set(file, setTimeout(async () => {
            pendingReloads.delete(file)
            if (fs.existsSync(file)) await loadFn(file)
            else await unloadFn(file)
        }, 200))
    }))
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        if (item.isDirectory()) watch(path.join(dir, item.name), loadFn, unloadFn)
    }
}

function extractCommandFromMessage(m) {
    let body = ''
    let isButtonResponse = false
    try {
        if (m.message) {
            if (m.message.conversation) body = m.message.conversation
            else if (m.message.extendedTextMessage?.text) body = m.message.extendedTextMessage.text
            else if (m.message.imageMessage?.caption) body = m.message.imageMessage.caption
            else if (m.message.videoMessage?.caption) body = m.message.videoMessage.caption
            else if (m.message.documentMessage?.caption) body = m.message.documentMessage.caption
            else if (m.message.interactiveResponseMessage) {
                const inter = m.message.interactiveResponseMessage
                if (inter.nativeFlowResponseMessage) {
                    const flow = inter.nativeFlowResponseMessage
                    if (flow.paramsJson) {
                        try {
                            const params = JSON.parse(flow.paramsJson)
                            body = params.id || params.buttonId || params.rowId || params.index || ''
                        } catch { body = flow.name || '' }
                    } else body = flow.name || ''
                    isButtonResponse = true
                } else if (inter.buttonReply) {
                    body = inter.buttonReply.selectedButtonId || ''
                    isButtonResponse = true
                } else if (inter.singleSelectReply) {
                    body = inter.singleSelectReply.selectedRowId || ''
                    isButtonResponse = true
                }
            } else if (m.message.templateButtonReplyMessage) {
                body = m.message.templateButtonReplyMessage.selectedId || ''
                isButtonResponse = true
            } else if (m.message.buttonsResponseMessage) {
                body = m.message.buttonsResponseMessage.selectedButtonId || ''
                isButtonResponse = true
            } else if (m.message?.stickerMessage) {
                body = '__MENU_STICKER__'
            }
        }
    } catch (error) {
        console.error('Error parsing message:', error)
    }
    return { body, isButtonResponse }
}

export default async function handleMessage(EliteProTech, m) {
    try {
        const { body, isButtonResponse } = extractCommandFromMessage(m)
        if (!body) return
        m.text = body
        m.isButtonResponse = isButtonResponse

        const ownerList = readJSON('./lib/database/owner.json')
        const number = m.sender.split('@')[0]
        const botNumber = EliteProTech.decodeJid(EliteProTech.user.id).split('@')[0]
        m.isOwner = ownerList.includes(number) || number === botNumber || number === global.owner
        if (global.botMode === 'self' && !m.isOwner && !m.fromMe) return

        const notifReply = async (text, title = 'Notification') => {
            await sendNotification(EliteProTech, m, title, text)
        }
        const logCommandUsage = (command, extra = '') => {
            const from = m.isGroup ? `group ${m.chat}` : 'DM'
            const usedPrefix = global.prefix
            console.log(
                chalk.cyan('CMD ') +
                chalk.yellow(`${usedPrefix}${command}`) +
                chalk.white(` from `) +
                chalk.green(m.sender) +
                chalk.white(` (${from})`) +
                (extra ? chalk.magenta(` ${extra}`) : '')
            )
        }

        const checkAccess = handler => {
            const permissions = [
                ['group', m.isGroup, global.botMessage.group],
                ['private', m.isDM, global.botMessage.private],
                ['admin', m.isAdmin, global.botMessage.admin],
                ['isBotAdmin', m.isBotAdmin, global.botMessage.isBotAdmin],
                ['owner', m.isOwner, global.botMessage.owner]
            ]
            for (const [key, allowed, message] of permissions) {
                if (handler[key] && !allowed) {
                    if (!handler.silentDeny) notifReply(message, 'Access Denied')
                    return true
                }
            }
            return false
        }

        if (isButtonResponse) {
            let bodyText = body
            if (bodyText.startsWith(global.prefix)) {
                bodyText = bodyText.slice(global.prefix.length)
            }

            const args = bodyText.trim().split(/\s+/)
            const command = args.shift().toLowerCase()

            const handler = plugins.get(command)
            if (!handler) return

            const denied = checkAccess(handler)
            if (denied) return

            logCommandUsage(command, '(button)')
            return await handler(m, {
                EliteProTech,
                args,
                text: args.join(' '),
                command,
                prefix: '',
                notifReply
            })
        }

        for (const handler of plugins.values()) {
            if (!handler.customPrefix) continue
            if (!handler.customPrefix.test(m.text)) continue
            const denied = checkAccess(handler)
            if (denied) return
            const text = m.text.replace(handler.customPrefix, '').trim()
            logCommandUsage(handler.customPrefix.toString(), '(custom prefix)')
            return await handler(m, {
                EliteProTech,
                args: text ? text.split(/\s+/) : [],
                text,
                command: '',
                prefix: '',
                notifReply
            })
        }

        const prefix = m.text.startsWith(global.prefix) ? global.prefix : null
        if (!prefix) return
        const body2 = m.text.slice(prefix.length).trim()
        if (!body2) return
        const args = body2.split(/\s+/)
        const command = args.shift().toLowerCase()
        const handler = plugins.get(command)
        if (!handler) return
        const denied = checkAccess(handler)
        if (denied) return
        logCommandUsage(command)
        await handler(m, {
            EliteProTech,
            args,
            text: args.join(' '),
            command,
            prefix,
            notifReply
        })
    } catch (e) {
        console.error(e)
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const question = text => new Promise(resolve => rl.question(text, resolve))

let EliteProTech
let reconnectTimer = null
let pluginsLoaded = false
let eventsLoaded = false
let isConnecting = false

const getStatusCode = lastDisconnect => {
    try {
        if (!lastDisconnect?.error) return 0
        return Boom.isBoom(lastDisconnect.error)
            ? lastDisconnect.error.output.statusCode
            : lastDisconnect.error?.output?.statusCode || 0
    } catch {
        return 0
    }
}

function restartBot(delay = 5000) {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
    }
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        start()
    }, delay)
}

async function start() {
    if (isConnecting) return
    isConnecting = true

    try {
        if (EliteProTech) {
            EliteProTech.ev.removeAllListeners()
            EliteProTech.ws?.close?.()
        }

        const credsPath = path.join(__dirname, 'session', 'creds.json')
        if (!fs.existsSync(credsPath) && global.session) {
            try {
                const sessionData = JSON.parse(Buffer.from(global.session, 'base64').toString('utf-8'))
                fs.mkdirSync(path.dirname(credsPath), { recursive: true })
                fs.writeFileSync(credsPath, JSON.stringify(sessionData, null, 2))
                console.log(chalk.greenBright('Session restored from SESSION_ID'))
            } catch (err) {
                console.error(chalk.redBright(`Invalid SESSION_ID, falling back to pairing`))
            }
        }

        const { state, saveCreds } = await useMultiFileAuthState('./session')

        EliteProTech = makeWASocket({
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            cachedGroupMetadata: async (jid) => getGroupMetadata(EliteProTech, jid),
        })

        bind(EliteProTech)

        if (!state.creds.registered) {
            console.log('Enter the phone number example: 234x');
            const number = await question('Sending Code to : ');
            try {
                const code = await EliteProTech.requestPairingCode(number);
                console.log(`PAIRING CODE: ${code}`);
            } catch (err) {
                console.error('Failed to send pairing code:', err.message);
                process.exit(1);
            } finally {
                rl.close();
            }
        }

        EliteProTech.ev.on('creds.update', saveCreds)

        EliteProTech.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify' || messages.length === 0) return
            for (const raw of messages) {
                setImmediate(async () => {
                    try {
                        let m = raw
                        if (!m?.message || m.key.remoteJid === 'status@broadcast') return
                        m = await smsg(EliteProTech, m)
                        if (m) await handleMessage(EliteProTech, m)
                    } catch (e) {}
                })
            }
        })

        EliteProTech.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            const statusCode = getStatusCode(lastDisconnect)
            const errorMessage = lastDisconnect?.error?.message || ''

            if (connection === 'open') {
                isConnecting = false
                if (reconnectTimer) {
                    clearTimeout(reconnectTimer)
                    reconnectTimer = null
                }
                if (!pluginsLoaded) {
                    await initPlugins()
                    pluginsLoaded = true
                }
                if (!eventsLoaded) {
                    await initEvents()
                    eventsLoaded = true
                }
                wireEventDispatchers(EliteProTech)
                return
            }

            if (connection === 'close') {
                isConnecting = false
                if (statusCode === DisconnectReason.loggedOut) return
                let delay = 5000
                if (errorMessage.includes('Stream Errored')) {
                    delay = 15000
                } else if (statusCode === DisconnectReason.connectionLost || statusCode === 0) {
                    delay = 8000
                }
                restartBot(delay)
            }
        })

        setInterval(() => {
            if (EliteProTech?.user && EliteProTech?.ws?.readyState === 1) {
                EliteProTech.sendPresenceUpdate('available')
            }
        }, 60000)

    } catch (e) {
        isConnecting = false
        if (!reconnectTimer) {
            restartBot(10000)
        }
    }
}

process.on('SIGINT', async () => {
    try {
        if (reconnectTimer) clearTimeout(reconnectTimer)
        EliteProTech?.ev.removeAllListeners()
        EliteProTech?.ws?.close?.()
    } catch {}
    process.exit(0)
})

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
    start()
}
