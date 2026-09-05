import { sendRichHtml } from '../../lib/richhtml.js'

const html = `<style>*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}body{margin:0;background:#0c0b16;color:#fff;font-family:Arial,sans-serif}.card{max-width:560px;margin:auto;padding:17px;border-radius:22px;background:radial-gradient(circle at top right,#563b87,#171424 59%,#0c0b16);border:1px solid #7962b8;box-shadow:0 14px 38px #0009}.top{display:flex;justify-content:space-between;align-items:center}.eyebrow{font-size:9px;letter-spacing:2px;color:#c0b4e1}.title{font-size:23px;font-weight:900;margin-top:4px}.score{text-align:right}.score b{display:block;font-size:25px;color:#f2edff}.board{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:17px}.tile{aspect-ratio:1;border:0;border-radius:15px;background:linear-gradient(145deg,#7561ae,#30264e);box-shadow:inset 0 2px #ffffff2b,0 5px 10px #0005;font-size:27px;color:transparent;transition:transform .15s,background .18s}.tile:active{transform:scale(.94)}.tile.open,.tile.done{background:#f2edff;color:#261b42}.tile.done{background:#bff2d5;color:#15482e}.bar{margin-top:16px;display:flex;align-items:center;gap:10px}.status{flex:1;min-height:40px;padding:11px;border-radius:11px;background:#ffffff12;color:#ddd3fb;font-size:12px;font-weight:bold}.new{border:0;border-radius:11px;padding:12px 15px;background:#7055bb;color:#fff;font-size:11px;font-weight:900;letter-spacing:1px}.new:active{transform:scale(.96)}.hint{text-align:center;margin-top:11px;color:#aaa0c8;font-size:10px}</style><div class="card"><div class="top"><div><div class="eyebrow">ELITE-PRO-V2 GAME</div><div class="title">🧠 Memory Match</div></div><div class="score"><div class="eyebrow">MOVES</div><b id="moves">0</b></div></div><div class="board" id="board"></div><div class="bar"><div class="status" id="status">Find all matching pairs.</div><button class="new" id="new">NEW GAME</button></div><div class="hint">Tap two cards to find a matching pair.</div></div><script>const icons=['🍉','🎮','⚡','🚀','🎧','👑','💎','🔥'];const board=document.getElementById('board'),status=document.getElementById('status'),movesEl=document.getElementById('moves');let cards,open=[],moves=0,lock=false,matched=0;function shuffle(a){return a.sort(()=>Math.random()-.5)}function game(){cards=shuffle([...icons,...icons]).map((icon,i)=>({icon,i,done:false}));open=[];moves=0;lock=false;matched=0;movesEl.textContent=0;status.textContent='Find all matching pairs.';draw()}function draw(){board.innerHTML='';cards.forEach((c,i)=>{let b=document.createElement('button');b.className='tile'+(open.includes(i)?' open':'')+(c.done?' done':'');b.textContent=(open.includes(i)||c.done)?c.icon:'?';b.onclick=()=>pick(i);board.appendChild(b)})}function pick(i){if(lock||cards[i].done||open.includes(i))return;open.push(i);draw();if(open.length<2)return;moves++;movesEl.textContent=moves;let[a,b]=open;if(cards[a].icon===cards[b].icon){cards[a].done=cards[b].done=true;matched+=2;open=[];status.textContent=matched===cards.length?'🏆 You won in '+moves+' moves!':'Match found!';draw()}else{lock=true;status.textContent='Not a match — try again.';setTimeout(()=>{open=[];lock=false;draw()},650)}}document.getElementById('new').onclick=game;game()</script>`

let handler = async (m, { EliteProTech }) => {
    try {
        await sendRichHtml(EliteProTech, m.chat, {
            id: 'elite-memory',
            title: 'ELITE-PRO-V2 • MEMORY MATCH',
            html,
            source: 'eliteprotech'
        })
    } catch (error) {
        await m.reply(`Unable to send Memory Match: ${error.message || String(error)}`)
    }
}

handler.command = ['memory', 'matchgame']

export default handler
