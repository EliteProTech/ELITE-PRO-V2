/*
plugins esm swgc
*/

import { generateWAMessageContent } from "baileys";

const hex_to_argb = (hex) => {
    if (!hex) return undefined;
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return ((0xFF << 24) | (r << 16) | (g << 8) | b) >>> 0;
};

async function groupStatus(conn, jid, content) {
    const { backgroundColor, font } = content;
    delete content.backgroundColor;
    delete content.font;

    const inside = await generateWAMessageContent(content, {
        upload: conn.waUploadToServer
    });

    const messageType = Object.keys(inside)[0];

    const groupStatusContext = {
        featureEligibilities: {
            canReceiveMultiReact: true
        },
        statusSourceType: 4,
        statusAttributions: [
            { type: 10 }
        ],
        isGroupStatus: true,
        statusAudienceMetadata: {
            audienceType: 1
        }
    };

    inside[messageType].contextInfo = {
        ...(inside[messageType].contextInfo || {}),
        ...groupStatusContext
    };

    if (messageType === 'extendedTextMessage') {
        if (backgroundColor) inside[messageType].backgroundArgb = backgroundColor;
        inside[messageType].textArgb = 4294967295;
        inside[messageType].font = font || 5;
        inside[messageType].previewType = 0;
        inside[messageType].inviteLinkGroupTypeV2 = 0;
    }

    await conn.relayMessage(jid, inside, {});
    return true;
}

let handler = async (m, { conn, usedPrefix, command, text }) => {
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || quoted.mtype || "";

    let caption = m.quoted
        ? (m.quoted.text || m.quoted.caption || "")
        : "";

    let targetJid = m.chat;

    if (text) {
        let input = text.trim();

        if (input.endsWith('@g.us')) {
            targetJid = input;
        } else {
            caption = input;
        }
    }

    if (!targetJid.endsWith('@g.us')) {
        return m.reply(
            `❌ This command must include a group ID when used in a private chat.\n\n` +
            `Format:\n` +
            `• ${usedPrefix + command} → upload to this group\n` +
            `• ${usedPrefix + command} 1234xxx@g.us → upload to another group`
        );
    }

    if (targetJid !== m.chat) {
        const groupMetadata = await conn.groupMetadata(targetJid).catch(() => null);

        if (!groupMetadata) {
            return m.reply(
                '❌ The bot is not a member of that group or the group ID is invalid!'
            );
        }
    }

    try {
        let payload = {};

        if (/image|imageMessage/.test(mime)) {
            const buffer = await quoted.download();

            payload = {
                image: buffer,
                caption
            };

        } else if (/video|videoMessage/.test(mime)) {
            const buffer = await quoted.download();

            payload = {
                video: buffer,
                caption
            };

        } else if (/audio|audioMessage/.test(mime)) {
            const buffer = await quoted.download();

            payload = {
                audio: buffer,
                mimetype: "audio/mp4"
            };

        } else if (caption) {
            payload = {
                text: caption,
                backgroundColor: hex_to_argb('#1B5E20'),
                font: 5
            };

        } else {
            return await m.reply(
                `❌ Reply to media or type the text you want to use as a status.\n\n` +
                `Format:\n` +
                `• ${usedPrefix + command} → upload text to this group\n` +
                `• ${usedPrefix + command} 1234xxx@g.us → upload to another group`
            );
        }

        await groupStatus(conn, targetJid, payload);

        if (targetJid === m.chat) {
            await m.reply(`✅ Successfully uploaded to the group status.`);
        } else {
            await m.reply(`✅ Successfully uploaded to ${targetJid}`);
        }

    } catch (err) {
        console.error(err);

        await m.reply(
            '❌ An error occurred: ' + (err.message || err)
        );
    }
};

handler.help = ['swgc'];
handler.tags = ['owner'];
handler.command = ['swgc'];
handler.rowner = true;

export default handler;
