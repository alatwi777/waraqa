'use strict';
// Scheduling only: no account data, images or network access.
self.onmessage=({data})=>{if(!Number.isSafeInteger(data?.id)||!Number.isFinite(data?.milliseconds)||data.milliseconds<0||data.milliseconds>90000)return;setTimeout(()=>self.postMessage(data.id),data.milliseconds);};
