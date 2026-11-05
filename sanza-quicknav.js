(function(){
  if(document.querySelector('.navlinks .home-return'))return;
  var bar=document.createElement('nav');
  bar.className='sanza-global-quicknav';
  bar.setAttribute('aria-label','SanZa quick navigation');
  bar.innerHTML='<a href="/index.html#welcome-gate">😎 YUP BRO</a><a href="/index.html#sanza-explore">🚀 EXPLORE SANZA</a>';
  var style=document.createElement('style');
  style.textContent='.sanza-global-quicknav{display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 8px;background:#0d1018;border-bottom:1px solid #6b5526;position:relative;z-index:100;font-family:system-ui,sans-serif}.sanza-global-quicknav a{display:inline-flex;justify-content:center;align-items:center;min-height:40px;padding:9px 14px;border-radius:11px;border:1px solid #9b792f;background:#211a0c;color:#ffd34d;text-decoration:none;font-weight:900;font-size:12px;white-space:nowrap}.sanza-global-quicknav a:last-child{background:#ffd34d;color:#14110a}.sanza-global-quicknav a:focus-visible{outline:3px solid #57e9ff;outline-offset:2px}@media(max-width:390px){.sanza-global-quicknav a{font-size:10px;padding:9px 10px}}';
  document.head.appendChild(style);
  document.body.insertBefore(bar,document.body.firstChild);
})();