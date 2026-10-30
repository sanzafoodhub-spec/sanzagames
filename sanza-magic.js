/* SanZa Magic — lightweight, accessible motion. No seasonal homepage decorations. */
(()=>{'use strict';
const key='sanza-magic-enabled-v3';
let enabled=localStorage.getItem(key)!=='false';
const root=document.documentElement;
const toggle=document.createElement('button');
toggle.id='sanza-magic-toggle';toggle.type='button';
const reveal=()=>{if(!enabled||!('IntersectionObserver'in window))return;
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('sanza-magic-reveal');io.unobserve(e.target)}}),{threshold:.08});
document.querySelectorAll('.game,.hub-card,.subject-card,.coming,.info-panel,.video-banner').forEach(e=>io.observe(e));
};
const render=()=>{root.classList.toggle('sanza-magic-on',enabled);toggle.textContent=enabled?'✨ SanZa Magic: ON':'✨ SanZa Magic: OFF';toggle.setAttribute('aria-pressed',String(enabled));};
toggle.addEventListener('click',()=>{enabled=!enabled;localStorage.setItem(key,String(enabled));render();});
document.addEventListener('DOMContentLoaded',()=>{document.body.appendChild(toggle);render();reveal();});
if(document.readyState!=='loading'){document.body.appendChild(toggle);render();reveal();}
})();