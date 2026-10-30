/* SanZa Magic: date-driven seasonal effects use Ireland/Dublin calendar */
(()=>{'use strict';
const zone='Europe/Dublin';
const parts=()=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());const o={};p.forEach(x=>o[x.type]=Number(x.value));return o};
const today=parts(),m=today.month,d=today.day,y=today.year;
const between=(a,b)=>{const n=m*100+d;return n>=a&&n<b};
let season=null;
if(between(1001,1101))season='halloween';
else if(between(1125,1228))season='christmas';
else if(between(1230,1232)||between(101,102))season='newyear';
else if(between(201,216))season='valentines';
else if(between(301,319))season='patrick';
const key='sanza-magic-enabled';
let enabled=localStorage.getItem(key)!=='false';
const root=document.documentElement;
const layer=document.createElement('div');layer.id='sanza-season-layer';document.body.appendChild(layer);
const toggle=document.createElement('button');toggle.id='sanza-magic-toggle';toggle.type='button';
const render=()=>{root.classList.toggle('sanza-magic-on',enabled);toggle.textContent=enabled?'✨ SanZa Magic: ON':'✨ SanZa Magic: OFF';toggle.setAttribute('aria-pressed',String(enabled));layer.replaceChildren();document.querySelectorAll('.sanza-magic-reveal').forEach(e=>e.classList.remove('sanza-magic-reveal'));if(!enabled||!season)return;
const cfg={halloween:['🎃','👻','🦇','✨'],christmas:['❄️','✨','🎄'],newyear:['🎆','✨','🎉'],valentines:['❤️','💖','✨'],patrick:['☘️','✨','🍀']}[season];
for(let i=0;i<16;i++){const p=document.createElement('span');p.className='sanza-season-particle';p.textContent=cfg[i%cfg.length];p.style.left=(Math.random()*100)+'%';p.style.animationDuration=(9+Math.random()*12)+'s';p.style.animationDelay=(-Math.random()*18)+'s';p.style.fontSize=(12+Math.random()*12)+'px';p.style.setProperty('--drift',(Math.random()*100-50)+'px');layer.appendChild(p)}
const labels={halloween:'🎃 Halloween mode',christmas:'🎄 Christmas magic',newyear:'🎆 Happy New Year',valentines:'❤️ Valentine’s mode',patrick:'☘️ St Patrick’s mode'};
const banner=document.createElement('div');banner.className='sanza-season-banner';banner.textContent=labels[season];document.body.appendChild(banner);
if(season==='newyear'){const target=new Date(y+((m===12)?1:0),0,1);const box=document.createElement('div');box.className='sanza-countdown';box.setAttribute('aria-label','New Year countdown');banner.after(box);const update=()=>{const diff=Math.max(0,target-Date.now());const days=Math.floor(diff/86400000),hours=Math.floor(diff%86400000/3600000),mins=Math.floor(diff%3600000/60000),secs=Math.floor(diff%60000/1000);box.innerHTML=[days+'|Days',hours+'|Hours',mins+'|Mins',secs+'|Secs'].map(v=>{const [n,l]=v.split('|');return '<span>'+n+'<small>'+l+'</small></span>'}).join('')};update();setInterval(update,1000)}
};
toggle.addEventListener('click',()=>{enabled=!enabled;localStorage.setItem(key,String(enabled));document.querySelectorAll('.sanza-season-banner,.sanza-countdown').forEach(e=>e.remove());render()});
document.body.appendChild(toggle);render();
if(enabled&&'IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('sanza-magic-reveal');io.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.game,.hub-card,.subject-card,.coming,.info-panel,.video-banner').forEach(e=>io.observe(e))}
})();