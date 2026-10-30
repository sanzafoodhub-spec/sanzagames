/* SanZa Magic — optional, lightweight site-wide motion. No seasonal decorations. */
(()=>{'use strict';
const key='sanza-magic-enabled-v3';
const root=document.documentElement;
let enabled=true;
try{enabled=localStorage.getItem(key)!=='false'}catch(_){}
const toggle=document.createElement('button');
toggle.id='sanza-magic-toggle';
toggle.type='button';
toggle.setAttribute('aria-label','Toggle SanZa visual effects');
const revealTargets='.game,.hub-card,.subject-card,.coming,.info-panel,.video-banner';
const render=()=>{
  root.classList.toggle('sanza-magic-on',enabled);
  toggle.textContent=enabled?'✨ SanZa Magic: ON':'✨ SanZa Magic: OFF';
  toggle.setAttribute('aria-pressed',String(enabled));
};
toggle.addEventListener('click',()=>{
  enabled=!enabled;
  try{localStorage.setItem(key,String(enabled))}catch(_){}
  render();
});
document.addEventListener('DOMContentLoaded',()=>{
  document.body.appendChild(toggle);
  render();
  if(enabled&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver'in window){
    const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('sanza-magic-reveal');io.unobserve(entry.target)}
    }),{threshold:.08});
    document.querySelectorAll(revealTargets).forEach(el=>io.observe(el));
  }
});
})();