import { sendRichHtml } from '../../lib/richhtml.js'

const html = `<style>*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}body{margin:0;background:#101018;color:#fff;font-family:Arial}.card{max-width:620px;margin:auto;padding:16px;background:linear-gradient(145deg,#25213d,#101018);border-radius:18px}.small{font-size:10px;color:#aaa;letter-spacing:1px}.keys{position:relative;display:flex;height:185px;margin-top:14px;padding:8px;background:#09090d;border-radius:14px}.white{flex:1;margin:0 2px;border:0;border-radius:0 0 9px 9px;background:linear-gradient(#fff,#d8d8df);color:#333;font-weight:bold;padding-top:140px}.black{position:absolute;top:8px;width:10%;height:105px;border:0;border-radius:0 0 8px 8px;background:#15151c;color:#eee;z-index:2}.black:active,.white:active{transform:translateY(3px);background:#a99bea}.b1{left:13%}.b2{left:26.5%}.b3{left:53.5%}.b4{left:67%}.b5{left:80.5%}.note{text-align:center;margin-top:12px;font-size:22px;font-weight:bold;color:#c7bfff}</style><div class="card"><div class="small">ELITE-PRO-V2 GAME</div><h2>🎹 Piano</h2><div class="keys" id="keys"><button class="white" data-n="C">C</button><button class="white" data-n="D">D</button><button class="white" data-n="E">E</button><button class="white" data-n="F">F</button><button class="white" data-n="G">G</button><button class="white" data-n="A">A</button><button class="white" data-n="B">B</button><button class="black b1" data-n="C#">C#</button><button class="black b2" data-n="D#">D#</button><button class="black b3" data-n="F#">F#</button><button class="black b4" data-n="G#">G#</button><button class="black b5" data-n="A#">A#</button></div><div class="note" id="note">TAP A KEY</div></div><script>const notes={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};let ctx;function play(n){ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();let o=ctx.createOscillator(),g=ctx.createGain(),f=440*Math.pow(2,(notes[n]+60-69)/12);o.frequency.value=f;g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.3,ctx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.7);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.72);document.getElementById('note').textContent='PLAYING '+n+'4'}document.querySelectorAll('[data-n]').forEach(k=>k.addEventListener('pointerdown',e=>{e.preventDefault();play(k.dataset.n)}))</script>`

let handler = async (m, { EliteProTech }) => {
    try {
        await sendRichHtml(EliteProTech, m.chat, { id: 'elite-piano', title: 'ELITE-PRO-V2 • PIANO', html, source: 'eliteprotech' })
    } catch (error) {
        await m.reply(`Unable to send Piano: ${error.message || String(error)}`)
    }
}

handler.command = ['piano']

export default handler
