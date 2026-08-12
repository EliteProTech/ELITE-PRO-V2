import path from 'path';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';
import * as baileys from '@whiskeysockets/baileys';

let _makeWaSocket = baileys.default;
if (typeof _makeWaSocket !== 'function') {
    _makeWaSocket = baileys.makeWASocket;
}
if (typeof _makeWaSocket !== 'function') {
    _makeWaSocket = baileys.makeSocket;
}
if (typeof _makeWaSocket !== 'function' && baileys.default && typeof baileys.default === 'object') {
    _makeWaSocket = baileys.default.default || baileys.default.makeWASocket || baileys.default.makeSocket;
}
if (typeof _makeWaSocket !== 'function') {
    throw new Error(`makeWASocket not found in Baileys. Available exports: ${Object.keys(baileys).join(', ')}`);
}

const { downloadContentFromMessage, jidDecode, areJidsSameUser, generateWAMessage } = baileys;

const groupMetadataCache = new Map();
const GROUP_METADATA_TTL = 5 * 60 * 1000;

const lidCache = new Map();
const LID_CACHE_TTL = 30 * 60 * 1000;

export function setGroupMetadataCache(id, metadata) {
    groupMetadataCache.set(id, { data: metadata, fetchedAt: Date.now() });
}

export async function getGroupMetadata(EliteProTech, id, forceRefresh = false) {
    const cached = groupMetadataCache.get(id);
    const isFresh = cached && (Date.now() - cached.fetchedAt) < GROUP_METADATA_TTL;
    if (!forceRefresh && isFresh) return cached.data;
    const metadata = await EliteProTech.groupMetadata(id).catch(() => null);
    if (metadata) setGroupMetadataCache(id, metadata);
    else if (cached) return cached.data;
    return metadata;
}

async function resolveLidCached(EliteProTech, lid) {
    if (!lid || !lid.endsWith('@lid')) return lid;

    const cached = lidCache.get(lid);
    if (cached && (Date.now() - cached.fetchedAt) < LID_CACHE_TTL) {
        return cached.jid;
    }

    let resolved = lid;
    try {
        const pn = await EliteProTech.signalRepository?.lidMapping?.getPNForLID(lid);
        if (pn) resolved = pn;
    } catch {}

    lidCache.set(lid, { jid: resolved, fetchedAt: Date.now() });
    return resolved;
}

export function makeWASocket(connectionOptions, options = {}) {
    let EliteProTech = _makeWaSocket(connectionOptions);

    EliteProTech.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
        } else return jid;
    };

    EliteProTech.reply = (jid, text, m, options) => {
        return EliteProTech.sendMessage(jid, { text: text }, { quoted: m, ...options });
    };

    EliteProTech.resolveLidToJid = EliteProTech.resolveLidToJid || (async (lid) => resolveLidCached(EliteProTech, lid));

    EliteProTech.getFile = async (PATH, saveToFile = false) => {
        let res, filename;
        const data = Buffer.isBuffer(PATH)
            ? PATH
            : PATH instanceof ArrayBuffer
                ? Buffer.from(PATH)
                : /^data:.*?\/.*?;base64,/i.test(PATH)
                    ? Buffer.from(PATH.split`,`[1], 'base64')
                    : /^https?:\/\//.test(PATH)
                        ? (res = await fetch(PATH), Buffer.from(await res.arrayBuffer()))
                        : fs.existsSync(PATH)
                            ? (filename = PATH, fs.readFileSync(PATH))
                            : typeof PATH === 'string'
                                ? Buffer.from(PATH)
                                : Buffer.alloc(0);
        if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');
        const type = await fileTypeFromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
        if (data && saveToFile && !filename) {
            const tmpDir = './tmp';
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
            filename = path.join(tmpDir, `${Date.now()}.${type.ext}`);
            fs.writeFileSync(filename, data);
        }
        return {
            res,
            filename,
            ...type,
            data,
            deleteFile() {
                return filename && fs.unlinkSync(filename);
            }
        };
    };

    EliteProTech.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
        let type = await EliteProTech.getFile(path, true);
        let { res, data: file, filename: pathFile } = type;
        if (res && res.status !== 200) {
            try {
                const errJson = JSON.parse(file.toString());
                throw { json: errJson };
            } catch (e) {
                throw e;
            }
        }
        const fileSize = fs.statSync(pathFile).size / 1024 / 1024;
        if (fileSize >= 100) throw new Error('File size is too big!');
        let opt = {};
        if (quoted) opt.quoted = quoted;
        if (!type.mime || type.mime === 'application/octet-stream') options.asDocument = true;
        let mtype = '', mimetype = options.mimetype || type.mime;
        if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
        else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
        else if (/video/.test(type.mime)) mtype = 'video';
        else if (/audio/.test(type.mime)) mtype = 'audio';
        else mtype = 'document';
        if (options.asDocument) mtype = 'document';

        let message = {
            ...options,
            caption,
            ptt,
            [mtype]: { url: pathFile },
            mimetype,
            fileName: filename || pathFile.split('/').pop()
        };
        let m;
        try {
            m = await EliteProTech.sendMessage(jid, message, { ...opt, ...options });
        } catch (e) {
            m = null;
        } finally {
            if (!m) m = await EliteProTech.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
            return m;
        }
    };

    EliteProTech.downloadM = async (m, type, saveToFile) => {
        let M = m.msg || m;
        let mtype = M.mtype ? M.mtype.replace(/Message/i, '') : type;
        let message = M.message ? M.message[mtype] : M;
        let stream = await downloadContentFromMessage(message, mtype);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        if (saveToFile) {
            let ran = Math.floor(Math.random() * 100000);
            let ext = message.mimetype.split('/')[1];
            let filename = path.join('./tmp', `${ran}.${ext}`);
            fs.writeFileSync(filename, buffer);
            return filename;
        }
        return buffer;
    };

    return EliteProTech;
}

function extractRealMessage(msg) {
    if (!msg) return null;
    if (msg.ephemeralMessage) return extractRealMessage(msg.ephemeralMessage.message);
    if (msg.viewOnceMessage) return extractRealMessage(msg.viewOnceMessage.message);
    if (msg.viewOnceMessageV2) return extractRealMessage(msg.viewOnceMessageV2.message);
    if (msg.documentWithCaptionMessage) return extractRealMessage(msg.documentWithCaptionMessage.message);
    if (msg.editedMessage) return extractRealMessage(msg.editedMessage.message);
    if (msg.botForwardedMessage) return extractRealMessage(msg.botForwardedMessage.message);
    return msg;
}

export async function smsg(EliteProTech, m) {
    if (!m) return m;
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJidAlt || m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.isDM = !m.isGroup;

        const rawSender = m.key.participantAlt || m.key.participant || m.chat;
        m.sender = EliteProTech.decodeJid(m.fromMe && EliteProTech.user.id || rawSender || '');

        let groupMetadata = null;
        if (m.isGroup) {
            groupMetadata = await getGroupMetadata(EliteProTech, m.chat);
        }

        if (m.sender.endsWith('@lid')) {
            if (m.isGroup) {
                const p = groupMetadata?.participants?.find(u => u.id === m.sender);
                m.sender = EliteProTech.decodeJid(
                    p?.phoneNumber || await EliteProTech.resolveLidToJid(m.sender)
                );
            } else {
                m.sender = EliteProTech.decodeJid(
                    await EliteProTech.resolveLidToJid(m.sender)
                );
            }
        }

        if (m.isGroup) {
            const participants = groupMetadata?.participants || [];
            const matchParticipant = (...candidates) =>
                participants.find(p => candidates.some(c => c && (p.id === c || p.lid === c || p.phoneNumber === c)));

            const senderParticipant = matchParticipant(m.sender, m.key.participant, m.key.participantAlt);
            m.isAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';

            const botId = EliteProTech.decodeJid(EliteProTech.user.id);
            const botLid = EliteProTech.user.lid ? EliteProTech.decodeJid(EliteProTech.user.lid) : null;
            const botParticipant = matchParticipant(botId, botLid);
            m.isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
        } else {
            m.isAdmin = false;
            m.isBotAdmin = false;
        }
    }

    if (m.message) {
        m.mtype = Object.keys(m.message)[0];
        m.msg = m.message[m.mtype];
        if (m.mtype === 'viewOnceMessageV2') {
            m.msg = m.message.viewOnceMessageV2.message;
            m.mtype = Object.keys(m.msg)[0];
            m.msg = m.msg[m.mtype];
        }
        let text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || '';
        m.text = typeof m.msg === 'string' ? m.msg : text;
        m.download = (saveToFile = false) => EliteProTech.downloadM(m, m.mtype.replace(/Message/i, ''), saveToFile);

        let mentioned = [];
        if (m.msg?.contextInfo?.mentionedJid) {
            mentioned = m.msg.contextInfo.mentionedJid;
        } else if (m.message?.[m.mtype]?.contextInfo?.mentionedJid) {
            mentioned = m.message[m.mtype].contextInfo.mentionedJid;
        }
        m.mentionedJid = mentioned.map(jid => EliteProTech.decodeJid(jid));

        let quotedRaw = null;
        if (m.msg?.contextInfo?.quotedMessage) {
            quotedRaw = m.msg.contextInfo.quotedMessage;
        } else if (m.msg?.messageContextInfo?.quotedMessage) {
            quotedRaw = m.msg.messageContextInfo.quotedMessage;
        } else if (m.message?.contextInfo?.quotedMessage) {
            quotedRaw = m.message.contextInfo.quotedMessage;
        } else if (m.message?.messageContextInfo?.quotedMessage) {
            quotedRaw = m.message.messageContextInfo.quotedMessage;
        }

        if (!quotedRaw && m.msg?.botForwardedMessage) {
            const botMsg = m.msg.botForwardedMessage.message;
            if (botMsg?.richResponseMessage?.contextInfo?.quotedMessage) {
                quotedRaw = botMsg.richResponseMessage.contextInfo.quotedMessage;
            }
        }

        if (quotedRaw) {
            let realQuoted = extractRealMessage(quotedRaw);
            if (!realQuoted) {
                m.quoted = null;
            } else {
                let type = Object.keys(realQuoted)[0];
                let quotedContent = realQuoted[type];
                if (!quotedContent) {
                    m.quoted = null;
                } else {
                    let quotedObj = {};
                    if (typeof quotedContent === 'string') {
                        quotedObj = { text: quotedContent };
                    } else if (quotedContent && typeof quotedContent === 'object') {
                        quotedObj = { ...quotedContent };
                    } else {
                        quotedObj = { text: '' };
                    }

                    quotedObj.mtype = type;
                    quotedObj.id = m.msg.contextInfo?.stanzaId || m.message?.contextInfo?.stanzaId || null;
                    quotedObj.chat = m.msg.contextInfo?.remoteJid || m.message?.contextInfo?.remoteJid || m.chat;
                    quotedObj.sender = EliteProTech.decodeJid(m.msg.contextInfo?.participant || m.message?.contextInfo?.participant);

                    if (quotedObj.sender?.endsWith('@lid')) {
                        if (m.isGroup) {
                            const meta = await getGroupMetadata(EliteProTech, m.chat);
                            const p = meta?.participants?.find(u => u.id === quotedObj.sender);
                            quotedObj.sender = EliteProTech.decodeJid(
                                p?.phoneNumber || await EliteProTech.resolveLidToJid(quotedObj.sender)
                            );
                        } else {
                            quotedObj.sender = EliteProTech.decodeJid(
                                await EliteProTech.resolveLidToJid(quotedObj.sender)
                            );
                        }
                    }

                    quotedObj.fromMe = areJidsSameUser(quotedObj.sender, EliteProTech.decodeJid(EliteProTech.user.id));
                    quotedObj.text = quotedObj.text || quotedObj.caption || '';
                    quotedObj.reply = (text, chatId, options) => EliteProTech.reply(chatId ? chatId : m.chat, text, m.quoted, options);
                    quotedObj.download = (saveToFile = false) => EliteProTech.downloadM(quotedObj, quotedObj.mtype.replace(/Message/i, ''), saveToFile);

                    m.quoted = quotedObj;
                }
            }
        } else {
            m.quoted = null;
        }
    }
    m.reply = (text, chatId, options) => EliteProTech.reply(chatId ? chatId : m.chat, text, m, options);
    return m;
}

export function bind(EliteProTech) {
    if (!EliteProTech.chats) EliteProTech.chats = {};
    if (!EliteProTech.contacts) EliteProTech.contacts = {};

    function updateNameToDb(contacts) {
        if (!contacts) return;
        try {
            contacts = contacts.contacts || contacts;
            for (const contact of contacts) {
                const id = EliteProTech.decodeJid(contact.id);
                if (!id || id === 'status@broadcast') continue;

                let chats = EliteProTech.chats[id];
                if (!chats) chats = EliteProTech.chats[id] = { ...contact, id };
                EliteProTech.chats[id] = {
                    ...chats,
                    ...contact,
                    ...(id.endsWith('@g.us') ?
                        { subject: contact.subject || contact.name || chats.subject || '' } :
                        { name: contact.notify || contact.name || chats.name || chats.notify || '' })
                };

                EliteProTech.contacts[id] = {
                    ...EliteProTech.contacts[id],
                    ...contact
                };
            }
        } catch (e) {}
    }

    EliteProTech.ev.on('contacts.upsert', updateNameToDb);
    EliteProTech.ev.on('contacts.update', updateNameToDb);
    EliteProTech.ev.on('contacts.set', updateNameToDb);
    EliteProTech.ev.on('groups.update', updateNameToDb);

    EliteProTech.ev.on('messages.reaction', (reactions) => {
        try {
            for (const reaction of reactions) {
                if (reaction.key?.participant) {
                    const jid = EliteProTech.decodeJid(reaction.key.participant);
                    if (jid && !EliteProTech.contacts[jid]) {
                        EliteProTech.contacts[jid] = { id: jid };
                    }
                }
            }
        } catch (e) {}
    });

    EliteProTech.ev.on('chats.set', async ({ chats }) => {
        try {
            for (let { id, name, readOnly } of chats) {
                id = EliteProTech.decodeJid(id);
                if (!id || id === 'status@broadcast') continue;
                const isGroup = id.endsWith('@g.us');
                let localChats = EliteProTech.chats[id];
                if (!localChats) localChats = EliteProTech.chats[id] = { id };
                localChats.isChats = !readOnly;
                if (name) localChats[isGroup ? 'subject' : 'name'] = name;
                if (isGroup) {
                    const metadata = await getGroupMetadata(EliteProTech, id, true);
                    if (name || metadata?.subject) localChats.subject = name || metadata.subject;
                    if (!metadata) continue;
                    localChats.metadata = metadata;
                }
            }
        } catch (e) {}
    });

    EliteProTech.ev.on('group-participants.update', async function updateParticipantsToDb({ id, participants, action }) {
        if (!id) return;
        id = EliteProTech.decodeJid(id);
        if (id === 'status@broadcast') return;
        if (!(id in EliteProTech.chats)) EliteProTech.chats[id] = { id };
        let localChats = EliteProTech.chats[id];
        localChats.isChats = true;
        const groupMetadata = await getGroupMetadata(EliteProTech, id, true);
        if (!groupMetadata) return;
        localChats.subject = groupMetadata.subject;
        localChats.metadata = groupMetadata;
    });

    if (EliteProTech.user) {
        EliteProTech.contacts[EliteProTech.user.id] = {
            id: EliteProTech.user.id,
            name: EliteProTech.user.name,
            notify: EliteProTech.user.name
        };
    }
}

export async function sendNotification(EliteProTech, m, title, body) {
    const textMessage = `*${title}*\n\n${body}`
    const quotedMessage = {
        key: {
            remoteJid: 'status@broadcast',
            fromMe: false,
            id: 'EliteProTech',
            participant: '13135550002@s.whatsapp.net'
        },
        message: {
            locationMessage: {
                degreesLatitude: -6.200000,
                degreesLongitude: 106.816666,
                name: 'ELITE-PRO-V2',
                address: 'EliteProTech',
                jpegThumbnail: null
            }
        }
    }
    const msg = await generateWAMessage(
        m.chat,
        { text: textMessage },
        {
            userJid: EliteProTech.user.id,
            quoted: quotedMessage
        }
    )
    await EliteProTech.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
    })
}
