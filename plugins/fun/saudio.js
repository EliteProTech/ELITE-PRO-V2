import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import pathModule from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = pathModule.dirname(fileURLToPath(import.meta.url))

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const W = (() => {

const PKGS = ['@whiskeysockets/baileys', 'baileys', '@adiwajshing/baileys'];
let _dl = null;

async function getDownloader() {
  if (_dl) return _dl;
  for (const pkg of PKGS) {
    try {
      const mod = require(pkg);
      if (mod.downloadContentFromMessage) return (_dl = mod.downloadContentFromMessage);
    } catch {  }
    try {
      const mod = await import(pkg);
      const fn = mod.downloadContentFromMessage || mod.default?.downloadContentFromMessage;
      if (fn) return (_dl = fn);
    } catch {  }
  }
  throw new Error('Baileys could not be found for media downloads.');
}

const WRAPPERS = ['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension', 'documentWithCaptionMessage'];

function unwrap(message) {
  let m = message;
  for (let i = 0; i < 6 && m; i++) {
    const key = WRAPPERS.find((w) => m[w]?.message);
    if (!key) break;
    m = m[key].message;
  }
  return m;
}

function getMediaInfo(message) {
  const m = unwrap(message);
  if (!m) return null;
  for (const [type, field] of [['image', 'imageMessage'], ['video', 'videoMessage'], ['audio', 'audioMessage'], ['sticker', 'stickerMessage'], ['document', 'documentMessage']]) {
    if (m[field]) return { type, msg: m[field] };
  }
  return null;
}

function getQuoted(message) {
  const m = unwrap(message);
  if (!m) return null;
  for (const v of Object.values(m)) {
    const q = v && typeof v === 'object' ? v.contextInfo?.quotedMessage : null;
    if (q) return q;
  }
  return null;
}

function textOf(message) {
  const m = unwrap(message);
  if (!m) return '';
  return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || m.documentMessage?.caption || '';
}

async function toBuffer(stream) {
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks);
}

async function downloadMedia(info) {
  const dl = await getDownloader();
  return toBuffer(await dl(info.msg, info.type));
}

function sizeOf(msg) {
  const fl = msg && msg.fileLength;
  if (fl == null) return 0;
  if (typeof fl === 'object') return typeof fl.toNumber === 'function' ? fl.toNumber() : Number(fl.low) || 0;
  return Number(fl) || 0;
}

const MIME_EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg',
  'audio/mp4': 'm4a', 'application/pdf': 'pdf', 'text/plain': 'txt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};
const extOfMime = (mime) => MIME_EXT[String(mime || '').split(';')[0].trim().toLowerCase()] || 'bin';

const EXT_MIME = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4', mp3: 'audio/mpeg',
  txt: 'text/plain', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};
const mimeOfExt = (ext) => EXT_MIME[String(ext || '').toLowerCase()] || 'application/octet-stream';

return { getDownloader, unwrap, getMediaInfo, getQuoted, textOf, toBuffer, downloadMedia, sizeOf, extOfMime, mimeOfExt };
})();

const TMP = path.join(__dirname, '..', '..', 'tmp');
const SESSION_MS = 5 * 60 * 1000;
const MAX_VISUAL = 15 * 1024 * 1024;
const MAX_AUDIO = 16 * 1024 * 1024;
const MAX_SEC = 300;
const AUDIO_SEC = 30;
const WEBP_MAX = 900 * 1024;
const WEBP_FIT_MAX = 960 * 1024;
const ENC_TIMEOUT = 120000;

const sessions = new Map();
const NOLOG = { trace() {}, debug() {}, info() {}, warn() {}, error() {}, fatal() {}, child() { return NOLOG; }, level: 'silent' };

function friendly(msg) { const e = new Error(msg); e.friendly = true; return e; }

let FF = null;
function ffmpegBin() {
  if (FF !== null) return FF;
  const cand = [];
  if (process.env.FFMPEG_PATH) cand.push(process.env.FFMPEG_PATH);
  try { cand.push(require('ffmpeg-static')); } catch {}
  try { cand.push(require('@ffmpeg-installer/ffmpeg').path); } catch {  }
  cand.push('ffmpeg');
  for (const c of cand) {
    try {
      if (c.includes('/')) { try { fs.chmodSync(c, 0o755); } catch {  } }
      const r = spawnSync(c, ['-version'], { encoding: 'utf8', timeout: 10000 });
      if (r.status === 0 && /ffmpeg version/i.test(r.stdout || '')) {
        FF = c;
        console.log('[saudio] ffmpeg OK:', String(r.stdout).split('\n')[0].slice(0, 80), '(' + c + ')');
        return FF;
      }
    } catch {  }
  }
  FF = '';
  console.error('[saudio] FFmpeg was not found. Install the project dependencies or set FFMPEG_PATH.');
  return FF;
}
try { ffmpegBin(); } catch (e) { console.error('[saudio] FFmpeg check failed:', e.message); }

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegBin(), args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err = (err + d).slice(-3000); });
    const t = setTimeout(() => { p.kill('SIGKILL'); reject(new Error('FFmpeg timed out after 2 minutes.')); }, ENC_TIMEOUT);
    p.on('error', (e) => { clearTimeout(t); reject(e); });
    p.on('close', (code) => {
      clearTimeout(t);
      if (code === 0) return resolve();
      reject(new Error('FFmpeg failed: ' + err.split('\n').filter(Boolean).slice(-2).join(' | ').slice(0, 300)));
    });
  });
}

async function withTmp(files, makeArgs, outExt) {
  fs.mkdirSync(TMP, { recursive: true });
  const id = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const paths = files.map((f, i) => path.join(TMP, 'sa-' + id + '-i' + i + '.' + f.ext));
  const out = path.join(TMP, 'sa-' + id + '-o.' + outExt);
  try {
    files.forEach((f, i) => fs.writeFileSync(paths[i], f.buf));
    await runFfmpeg(makeArgs(paths, out));
    return fs.readFileSync(out);
  } finally {
    for (const f of [...paths, out]) { try { fs.unlinkSync(f); } catch {  } }
  }
}

function probeMedia(buf, ext) {
  fs.mkdirSync(TMP, { recursive: true });
  const f = path.join(TMP, 'sa-probe-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext);
  try {
    fs.writeFileSync(f, buf);
    const r = spawnSync(ffmpegBin(), ['-hide_banner', '-i', f], { encoding: 'utf8', timeout: 20000 });
    const txt = String(r.stderr || '');
    const d = txt.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    const dur = d ? (+d[1]) * 3600 + (+d[2]) * 60 + parseFloat(d[3]) : null;
    return {
      dur,
      hasAudio: /Stream #\d+:\d+[^\n]*: Audio:/.test(txt),
      hasVideo: /Stream #\d+:\d+[^\n]*: Video:/.test(txt),
    };
  } finally { try { fs.unlinkSync(f); } catch {  } }
}

function parseRange(args) {
  for (const a of args) {
    const m = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(String(a));
    if (m) {
      const ss = parseFloat(m[1]); const en = parseFloat(m[2]);
      if (!(en > ss)) return { error: '⚠️ Invalid time range. Example: *.saudio 3-9* (start at 3 seconds and end at 9).' };
      return { ss, len: Math.min(AUDIO_SEC, en - ss) };
    }
  }
  return { ss: 0, len: AUDIO_SEC };
}

const VF = "scale='trunc(min(720,iw)/2)*2':-2,format=yuv420p";
const ENC = ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30', '-vf', VF, '-c:a', 'aac', '-b:a', '96k', '-t', String(MAX_SEC), '-shortest', '-movflags', '+faststart'];
function combineVideo(vis, audioBuf, audioExt) {
  const isVid = vis.kind === 'video';
  return withTmp([{ buf: vis.buf, ext: vis.ext }, { buf: audioBuf, ext: audioExt }], ([fv, fa], fo) => {
    const head = isVid ? ['-y', '-stream_loop', '-1', '-i', fv] : ['-y', '-loop', '1', '-framerate', '10', '-i', fv];
    return [...head, '-i', fa, '-map', '0:v:0', '-map', '1:a:0', ...(isVid ? [] : ['-tune', 'stillimage']), ...ENC, fo];
  }, 'mp4');
}

function toOpus(audioBuf, ext, opt) {
  const o = opt || {};
  const t = Math.min(AUDIO_SEC, o.t || AUDIO_SEC);
  return withTmp([{ buf: audioBuf, ext }], ([fa], fo) => [
    '-y', ...(o.ss ? ['-ss', String(o.ss)] : []), '-i', fa, '-vn', '-t', t.toFixed(2),
    '-c:a', 'libopus', '-b:a', '32k', '-ar', '48000', '-ac', '1', fo,
  ], 'ogg');
}

async function videoToWebp(vis) {
  const tries = [{ fps: 12, q: 40, t: 6 }, { fps: 10, q: 30, t: 5 }, { fps: 8, q: 20, t: 4 }];
  for (const t of tries) {
    const buf = await withTmp([{ buf: vis.buf, ext: vis.ext }], ([fv], fo) => [
      '-y', '-i', fv, '-t', String(t.t), '-an',
      '-vf', 'fps=' + t.fps + ',scale=512:512:force_original_aspect_ratio=increase,crop=512:512',
      '-c:v', 'libwebp', '-lossless', '0', '-q:v', String(t.q), '-compression_level', '4', '-loop', '0', fo,
    ], 'webp');
    if (buf.length <= WEBP_MAX) return { buf, animated: true };
  }
  throw new Error('The video is too large to turn into a sticker. Try a shorter video.');
}

async function videoToWebpFit(vis, ss, sec) {
  const enc = (t, fps, q, px = 512) => withTmp([{ buf: vis.buf, ext: vis.ext }], ([fv], fo) => [
    '-y', ...(ss ? ['-ss', String(ss)] : []), '-i', fv, '-t', t.toFixed(2), '-an',
    '-vf', 'fps=' + fps + ',scale=' + px + ':' + px + ':force_original_aspect_ratio=increase,crop=' + px + ':' + px,
    '-c:v', 'libwebp', '-lossless', '0', '-q:v', String(q), '-compression_level', '4', '-loop', '0', fo,
  ], 'webp');
  const ladder = [[10, 35, 512], [8, 25, 512], [10, 25, 320], [8, 25, 320], [8, 20, 320], [7, 20, 320], [5, 15, 512]];
  for (const [fps, q, px] of ladder) {
    const buf = await enc(sec, fps, q, px);
    console.log('[saudio] Full-length WebP: ' + sec.toFixed(1) + 's, ' + fps + ' fps, quality ' + q + ', ' + px + 'px = ' + buf.length + ' bytes');
    if (buf.length <= WEBP_FIT_MAX) return { buf, animated: true, sec, looped: false };
  }
  const short = [[6, 10, 35], [5, 8, 25], [4, 8, 20], [3, 6, 15]];
  for (const [t, fps, q] of short) {
    const buf = await enc(Math.min(t, sec), fps, q);
    console.log('[saudio] Looped WebP: ' + t + 's, ' + fps + ' fps, quality ' + q + ' = ' + buf.length + ' bytes');
    if (buf.length <= WEBP_MAX) return { buf, animated: true, sec, looped: true };
  }
  throw friendly('The video is too large to turn into a sticker. Try another video or a shorter clip.');
}

async function toWebp(vis) {
  if (vis.kind === 'video') return videoToWebp(vis);
  const sharp = require('sharp');
  const meta = await sharp(vis.buf).metadata();
  if (meta.pages && meta.pages > 1) {
    try {
      const b = await sharp(vis.buf, { animated: true }).resize(512, 512, { fit: 'cover' }).webp({ quality: 70, effort: 3 }).toBuffer();
      if (b.length <= WEBP_MAX) return { buf: b, animated: true };
    } catch {  }
  }
  const b = await sharp(vis.buf).resize(512, 512, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();
  return { buf: b, animated: false };
}

let B = null;
async function loadBaileys() {
  if (B) return B;
  const mod = await import('@whiskeysockets/baileys');
  B = mod.proto ? mod : (mod.default || mod);
  return B;
}
function patchProto(proto) {
  if (proto.Message.encode.__saudio) return;
  const orig = proto.Message.encode;
  const wrapped = function encode(message, writer) {
    const w = orig.call(this, message, writer);
    if (message && message.__audioSticker) w.uint32(1074).bytes(message.__audioSticker);
    return w;
  };
  wrapped.__saudio = true;
  proto.Message.encode = wrapped;
}

async function relayAudioSticker(sock, chat, web, ogg) {
  const b = await loadBaileys();
  const { Writer } = require('protobufjs/minimal');
  patchProto(b.proto);

  const opts = { upload: sock.waUploadToServer, logger: NOLOG };
  const st = await b.prepareWAMessageMedia({ sticker: web.buf, mimetype: 'image/webp', width: 512, height: 512, isAnimated: web.animated }, opts);
  const au = await b.prepareWAMessageMedia({ audio: ogg, mimetype: 'audio/ogg; codecs=opus', ptt: false }, opts);
  try {
    const pr = probeMedia(ogg, 'ogg');
    if (pr.dur) au.audioMessage.seconds = Math.max(1, Math.round(pr.dur));
  } catch {  }

  const audioBytes = b.proto.Message.AudioMessage.encode(au.audioMessage).finish();
  const smW = b.proto.Message.StickerMessage.encode(st.stickerMessage);
  smW.uint32(210).bytes(audioBytes);
  const smBytes = smW.finish();
  const innerBytes = Writer.create().uint32(210).bytes(smBytes).finish();
  const fpBytes = Writer.create().uint32(10).bytes(innerBytes).finish();

  const gen = b.generateMessageIDV2 || b.generateMessageID;
  const id = gen(sock.user && sock.user.id);
  await sock.relayMessage(chat, { __audioSticker: Buffer.from(fpBytes) }, { messageId: id });
  return { animated: web.animated, stickerBytes: web.buf.length, audioBytes: ogg.length };
}

async function sendWithSession(sock, chat, vis, audioBuf, audioExt, opt) {
  const ogg = await toOpus(audioBuf, audioExt, opt);
  const web = await toWebp(vis);
  return relayAudioSticker(sock, chat, web, ogg);
}

async function sendOwnSound(sock, chat, vis, range) {
  const pr = probeMedia(vis.buf, vis.ext);
  if (!pr.hasAudio) throw friendly('This video has no audio, so it cannot be made into a sound sticker. Use *.saudio visual* to save it as the visual, then add audio from another voice note or video.');
  const avail = pr.dur != null ? pr.dur - range.ss : AUDIO_SEC;
  if (!(avail > 0.5)) throw friendly('The selected start time is past the end of the video (video is about ' + Math.floor(pr.dur || 0) + ' seconds long).');
  const sec = Math.min(AUDIO_SEC, range.len, avail);
  const web = await videoToWebpFit(vis, range.ss, sec);
  const ogg = await toOpus(vis.buf, vis.ext, { ss: range.ss, t: web.sec });
  const r = await relayAudioSticker(sock, chat, web, ogg);
  r.sec = web.sec;
  r.looped = web.looped;
  return r;
}

const VISUAL = new Set(['image', 'sticker', 'video']);

async function saveVisual(info) {
  if (W.sizeOf(info.msg) > MAX_VISUAL) throw new Error('Visual media is too large (maximum 15 MB).');
  const buf = await W.downloadMedia(info);
  if (info.type === 'video') return { kind: 'video', buf, ext: 'mp4' };
  return { kind: info.type, buf, ext: info.type === 'sticker' ? 'webp' : 'jpg' };
}

const HELP = 'ℹ️ *How to use .saudio (sound stickers)*\n' +
  '*One step:* Reply to a video with *.saudio* to make a sound sticker from that video.\n' +
  '*Two steps:*\n1) Reply to an image or sticker with *.saudio* (for video visuals only, use *.saudio visual*)\n2) Reply to audio, a voice note, or a video with *.saudio* to add its sound.\n' +
  '*Trim audio:* Add a time range, for example *.saudio 3-9* (up to 30 seconds).\n' +
  'The visual session lasts 5 minutes. Use *.saudio cancel* to cancel it. Use *.saudio video* in step 2 to create a regular video instead.';

const execute = async (sock, m, args) => {
    const chat = m.key.remoteJid;
    const say = (text) => sock.sendMessage(chat, { text }, { quoted: m });
    const react = (emoji) => sock.sendMessage(chat, { react: { text: emoji, key: m.key } }).catch(() => {});
    const who = m.key.fromMe ? 'me' : (m.key.participant || chat);
    const key = chat + '|' + who;
    const sub = String(args[0] || '').toLowerCase();
    const visualOnly = sub === 'visual' || sub === 'v';

    if (sub === 'batal' || sub === 'cancel') {
      sessions.delete(key);
      return say('🗑️ The .saudio session was cancelled.');
    }

    const range = parseRange(args);
    if (range.error) return say(range.error);

    const q = W.getQuoted(m.message);
    const info = (q && W.getMediaInfo(q)) || W.getMediaInfo(m.message);
    if (!info) return say(HELP);
    if (!ffmpegBin()) return say('❌ FFmpeg is unavailable. Install the project dependencies or set FFMPEG_PATH, then restart the bot.');

    const live = () => {
      const s = sessions.get(key);
      if (s && s.exp > Date.now()) return s;
      sessions.delete(key);
      return null;
    };
    const fail = async (tag, e) => {
      if (e && e.friendly) {
        await react('⚠️');
        return say('⚠️ ' + e.message);
      }
      console.error('[saudio] ' + tag + ':', (e && (e.stack || e.message)) || e);
      await react('❌');
      return say('❌ Could not create the sound sticker: ' + String((e && e.message) || e).slice(0, 250));
    };

    if (info.type === 'video' && !visualOnly) {
      if (W.sizeOf(info.msg) > MAX_VISUAL) return say('❌ The video is too large (maximum 15 MB).');
      const vis = live();
      await react('⏳');
      try {
        const buf = await W.downloadMedia(info);
        if (vis) {
          const pr = probeMedia(buf, 'mp4');
          if (!pr.hasAudio) throw friendly('This video has no audio. Your saved visual session is still active; try an audio message, voice note, or another video.');
          if (pr.dur != null && range.ss >= pr.dur - 0.5) throw friendly('The selected start time is past the end of the video (video is about ' + Math.floor(pr.dur) + ' seconds long).');
          const r = await sendWithSession(sock, chat, vis, buf, 'mp4', { ss: range.ss, t: range.len });
          console.log('[saudio] Sound sticker created using audio from the video:', JSON.stringify(r));
          sessions.delete(key);
        } else {
          const r = await sendOwnSound(sock, chat, { kind: 'video', buf, ext: 'mp4' }, range);
          console.log('[saudio] Sound sticker created from the video:', JSON.stringify(r));
        }
        return react('✅');
      } catch (e) {
        return fail('video', e);
      }
    }

    if (VISUAL.has(info.type)) {
      await react('⏳');
      try {
        const vis = await saveVisual(info);
        vis.exp = Date.now() + SESSION_MS;
        sessions.set(key, vis);
        const t = setTimeout(() => { const s = sessions.get(key); if (s && s.exp <= Date.now()) sessions.delete(key); }, SESSION_MS + 1000);
        if (t.unref) t.unref();
        await react('✅');
        return say('✅ Visual saved.\nNow send or reply to an audio message, voice note, or video with `.saudio`.\n⏳ This session lasts 5 minutes.');
      } catch (e) {
        console.error('[saudio] Could not save visual:', e.message);
        await react('❌');
        return say('❌ Could not save the media: ' + String(e.message).slice(0, 200));
      }
    }

    if (info.type === 'audio') {
      const vis = live();
      if (!vis) return say('⚠️ No visual is saved, or the 5-minute session expired. First reply to an image or sticker with *.saudio* (for video visuals, use *.saudio visual*).');
      if (W.sizeOf(info.msg) > MAX_AUDIO) return say('❌ The audio is too large (maximum 16 MB).');
      await react('⏳');
      try {
        const audio = await W.downloadMedia(info);
        const ext = W.extOfMime(info.msg.mimetype) === 'bin' ? 'ogg' : W.extOfMime(info.msg.mimetype);
        if (sub === 'video') {
          const out = await combineVideo(vis, audio, ext);
          await sock.sendMessage(chat, { video: out, mimetype: 'video/mp4', gifPlayback: true }, { quoted: m });
        } else {
          const r = await sendWithSession(sock, chat, vis, audio, ext, { ss: range.ss, t: range.len });
          console.log('[saudio] Sound sticker created:', JSON.stringify(r));
        }
        sessions.delete(key);
        return react('✅');
      } catch (e) {
        return fail('combine', e);
      }
    }

    return say('❌ Unsupported media. Use a video for one-step mode, or use an image/sticker first and then audio, a voice note, or a video.');
  }

const handler = async (m, { EliteProTech, args }) => execute(EliteProTech, m, args)

handler.command = ['saudio', 'stickeraudio', 'stikeraudio']

export default handler
