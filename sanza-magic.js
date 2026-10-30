/* SanZa Magic — shared, free visual controls. No AI, microphone, voice or audio changes. */
(()=>{'use strict';
const key='sanza-magic-enabled-v5',root=document.documentElement;
let enabled=true;
try{enabled=localStorage.getItem(key)!=='false'}catch(_){}
const reduced=()=>window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const toggle=document.createElement('button');
toggle.id='sanza-magic-toggle';toggle.type='button';
toggle.setAttribute('aria-label','Toggle SanZa visual effects');
const render=()=>{root.classList.toggle('sanza-magic-on',enabled&&!reduced());toggle.textContent=enabled?'✨ SanZa Magic: ON':'✨ SanZa Magic: OFF';toggle.setAttribute('aria-pressed',String(enabled));};
toggle.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem(key,String(enabled))}catch(_){}render();});
const spotlight=document.createElement('button');
spotlight.id='sanza-spotlight-toggle';spotlight.type='button';spotlight.textContent='🌟 Yup Bro Spotlight';
spotlight.setAttribute('aria-pressed','false');spotlight.setAttribute('aria-label','Toggle Yup Bro stage spotlight');
spotlight.addEventListener('click',()=>{const stage=document.querySelector('.mascot-canvas-wrap');if(!stage)return;const on=!stage.classList.contains('sanza-stage-spotlight');stage.classList.toggle('sanza-stage-spotlight',on);spotlight.setAttribute('aria-pressed',String(on));spotlight.textContent=on?'🌟 Spotlight: ON':'🌟 Yup Bro Spotlight';});
const selectors='.game,.hub-card,.subject-card,.coming,.info-panel,.video-banner,.card,.panel,.guide,.mood,.subjects,.newsletter,.mascot-stage';
function init(){if(!document.body)return;document.body.append(toggle);if(document.querySelector('.mascot-canvas-wrap'))document.body.append(spotlight);render();
 if(!reduced()&&'IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('sanza-magic-reveal');io.unobserve(e.target)}}),{threshold:.07});document.querySelectorAll(selectors).forEach(el=>io.observe(el));}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();