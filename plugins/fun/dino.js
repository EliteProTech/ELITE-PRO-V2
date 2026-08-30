import { sendRichHtml } from '../../lib/richhtml.js'

const html = `<style>*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}body{margin:0;background:#101018;color:#fff;font-family:Arial}.card{max-width:620px;margin:auto;padding:16px;background:linear-gradient(145deg,#25213d,#101018);border-radius:18px}.head{display:flex;justify-content:space-between;align-items:center}.small{font-size:10px;color:#aaa;letter-spacing:1px}canvas{margin-top:14px;width:100%;border-radius:12px;background:#181827;border:1px solid #49436e}.hint{text-align:center;color:#bdb7d8;font-size:12px;margin-top:10px}</style><div class="card"><div class="head"><div><div class="small">ELITE-PRO-V2 GAME</div><h2>Dino Runner</h2></div><b id="score">00000</b></div><canvas id="game" width="560" height="190"></canvas><div class="hint">Tap anywhere to jump · Tap after game over to restart</div></div><script>const c=document.getElementById('game'),x=c.getContext('2d'),s=document.getElementById('score');let d,o,score,over,last;function reset(){d={x:55,y:135,v:0};o=[];score=0;over=false;last=0}function jump(){if(over)return reset();if(d.y===135)d.v=-12}function tick(t){let dt=Math.min((t-last||16)/16,2);last=t;if(!over){d.v+=.7*dt;d.y=Math.min(135,d.y+d.v*dt);if(d.y===135)d.v=0;if(Math.random()<.018*dt)o.push({x:570,w:16,h:25+Math.random()*35});o.forEach(a=>a.x-=6*dt);o=o.filter(a=>a.x>-30);for(const a of o)if(d.x+24>a.x&&d.x<a.x+a.w&&d.y+30>170-a.h)over=true;score+=dt;s.textContent=String(Math.floor(score)).padStart(5,'0')}x.clearRect(0,0,560,190);x.strokeStyle='#aaa';x.beginPath();x.moveTo(0,170);x.lineTo(560,170);x.stroke();x.fillStyle='#eee';x.fillRect(d.x,d.y,28,35);x.fillStyle='#e17a7a';o.forEach(a=>x.fillRect(a.x,170-a.h,a.w,a.h));if(over){x.fillStyle='#fff';x.font='bold 24px Arial';x.textAlign='center';x.fillText('GAME OVER',280,90);x.font='13px Arial';x.fillText('Tap to play again',280,115);x.textAlign='left'}requestAnimationFrame(tick)}document.addEventListener('pointerdown',e=>{e.preventDefault();jump()});reset();requestAnimationFrame(tick)</script>`

let handler = async (m, { EliteProTech }) => {
    try {
        await sendRichHtml(EliteProTech, m.chat, { id: 'elite-dino', title: 'ELITE-PRO-V2 • DINO RUNNER', html, source: 'eliteprotech' })
    } catch (error) {
        await m.reply(`Unable to send Dino Runner: ${error.message || String(error)}`)
    }
}

handler.command = ['dino']

export default handler
