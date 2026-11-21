/* SanZa Chat owner push notifications — preview-only foundation.
   Notifications are only displayed for explicit owner subscriptions once a
   verified backend has delivered a push event. No client-side secrets. */
self.addEventListener('push',event=>{
  let data={};try{data=event.data?event.data.json():{}}catch(e){}
  if(data.kind!=='sanza-owner-chat'||typeof data.id!=='string')return;
  event.waitUntil((async()=>{
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    // Never notify while an active, visible chat window is open.
    if(clients.some(c=>c.visibilityState==='visible'&&new URL(c.url).pathname==='/chat.html'))return;
    await self.registration.showNotification('SanZa Chat · New message',{
      body:'Someone has posted in SanZa Chat.',tag:'sanza-chat-owner',renotify:false,
      icon:'/sanza-logo.png',badge:'/sanza-logo.png',data:{url:'/chat.html',id:data.id}
    });
  })());
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=windows.find(c=>new URL(c.url).pathname==='/chat.html');
    if(existing)return existing.focus();
    return self.clients.openWindow('/chat.html');
  })());
});
