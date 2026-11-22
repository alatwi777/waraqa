const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const clone=value=>JSON.parse(JSON.stringify(value));
const empty=()=>({students:[],groups:['الأول المتوسط — أ','الأول المتوسط — ب'],exams:[],results:[]});
function service(){const accounts=new Map(),images=new Map(),calls=[];let lose=false,backupFail=false;
 const account=uid=>{if(!accounts.has(uid))accounts.set(uid,{revision:0,data:null,ops:new Map(),backupAt:null});return accounts.get(uid);};
 const output=(uid,a,more={})=>({uid,revision:a.revision,data:clone(a.data),updatedAt:a.revision?'2026-11-22T00:00:00Z':null,backupAt:a.backupAt,backupPending:!a.backupAt&&a.revision>0,storage:{database:'OVH France',images:'R2 EU',backup:'separate R2 archive'},...more});
 return{accounts,images,calls,loseNext(){lose=true;},backupFailure(v){backupFail=v;},async fetch(uid,url,options={}){
  const path=new URL(url).pathname,method=options.method||'GET',a=account(uid);calls.push({uid,path,method});let status=200,data;
  if(path.includes('/files/')){const key=decodeURIComponent(path.split('/files/')[1]),id=uid+':'+key;if(method==='PUT'){if(backupFail){status=503;data={error:'CLOUD_STORAGE_UNAVAILABLE'};}else{const value=JSON.parse(options.body).dataUrl;if(images.has(id)&&images.get(id)!==value){status=409;data={error:'CLOUD_FILE_IMMUTABLE'};}else{images.set(id,value);data={saved:true};}}}else if(!images.has(id)){status=404;data={error:'CLOUD_FILE_NOT_FOUND'};}else data={dataUrl:images.get(id)};
  }else if(method==='GET')data=output(uid,a);
  else{
   const body=JSON.parse(options.body),old=a.ops.get(body.operationId);
   if(old){a.backupAt=backupFail?null:'2026-11-22T00:00:01Z';data=output(uid,a,{operationRevision:old});}
   else if(body.baseRevision!==a.revision){status=409;data={error:'CLOUD_REVISION_CONFLICT'};}
   else{a.revision++;a.data=clone(body.data);a.ops.set(body.operationId,a.revision);a.backupAt=backupFail?null:'2026-11-22T00:00:01Z';data=output(uid,a,{operationRevision:a.revision});}
   if(status===200&&backupFail){status=503;data={error:'CLOUD_STORAGE_UNAVAILABLE'};}
   if(lose&&status===200){lose=false;throw Error('lost response after server commit');}
  }
  return{ok:status<400,status,json:async()=>clone(data)};
 }};
}
function browser(api,uid='teacher',data=empty(),memory=new Map(),images=new Map()){
 const nodes=new Map(),events={};const ownerKey='waraqa-pages-owner:/waraqa/';if(!memory.has(ownerKey))memory.set(ownerKey,uid);
 const localKey=memory.get(ownerKey)===uid?'waraqa-pages-v1:/waraqa/':'waraqa-pages-v2:/waraqa/:'+uid;
 let offline=false,deny=false;
 const ctx={console,crypto:webcrypto,uid:()=>webcrypto.randomUUID(),URL,AbortSignal,db:clone(data),scanState:null,location:{href:'https://alatwi777.github.io/waraqa/'},LocalStore:{key:localKey,blocked:false},window:{WaraqaAuthorized:true,WaraqaFirebaseUid:uid,WaraqaGetIdToken:async()=>'token',WaraqaDeviceId:'device',addEventListener:(name,fn)=>events[name]=fn},localStorage:{getItem:key=>memory.get(key)||null,setItem(key,value){if(deny)throw Error('quota');memory.set(key,value);}},document:{visibilityState:'visible',activeElement:{tagName:'DIV'},querySelector:selector=>selector.includes('waraqa-cloud-storage')?{content:'enabled'}:{content:'https://grading.invalid'}},navigator:{onLine:true},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},localFileGet:async key=>images.get(key),localFilePut:async(key,value)=>images.set(key,value),route(){},cloudDetails(){},toast(){},modal(){},closeModal(){},download(){},esc:String,save(){if(deny)return false;memory.set(localKey,JSON.stringify(ctx.db));return true;},fetch:async(url,options)=>{if(offline)throw Error('offline');if(ctx.beforeFetch)await ctx.beforeFetch(url,options);return api.fetch(uid,url,options);}};
 ctx.$=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',dataset:{},hidden:false,open:false,setAttribute(){}});return nodes.get(selector);};
 vm.createContext(ctx);for(const file of ['public/sync-merge.js','runtime/account-cloud.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 return{ctx,memory,images,localKey,run:code=>vm.runInContext(code,ctx),offline(value){offline=value;ctx.navigator.onLine=!value;},deny(value){deny=value;},get data(){return ctx.db;}};
}
(async()=>{
 const api=service(),initial=empty();initial.students.push({id:'s',name:'قديم',number:'001',group:'أ'});initial.results.push({id:'r',pages:{0:'photo'},exam:'e',student:'s'});const pictures=new Map([['photo','data:image/jpeg;base64,/9j/ChQ=']]);
 const a=browser(api,'teacher',initial,new Map(),pictures);await a.run('accountCloudStart()');assert.equal(a.run('AccountCloud.state'),'saved');assert.equal(api.accounts.get('teacher').data.students[0].number,'001');assert(a.images.has('waraqa-before-cloud-teacher'));
 const order=api.calls.filter(c=>c.method==='PUT');assert(order[0].path.includes('/files/'));assert(order[1].path.endsWith('/state'));
 const b=browser(api);await b.run('accountCloudStart()');assert.equal(b.data.students[0].name,'قديم');assert.equal(await b.run("accountCloudGetFile('photo')"),'data:image/jpeg;base64,/9j/ChQ=');
 const other=browser(api,'other');await other.run('accountCloudStart()');assert.equal(other.data.students.length,0);await assert.rejects(other.run("accountCloudGetFile('photo')"));
 a.offline(true);a.run("db.students[0].name='تعديل دون اتصال';save()");await a.run('accountCloudPush()');assert.equal(a.run('AccountCloud.state'),'offline');assert.equal(a.run('AccountCloud.dirty'),true);a.offline(false);
 // A refreshed browser uses its saved operation ID, even when the old POST committed.
 api.loseNext();await a.run('accountCloudPush()');assert(a.run('!!AccountCloud.operation'));const revision=api.accounts.get('teacher').revision;
 const refreshed=browser(api,'teacher',a.data,a.memory,a.images);await refreshed.run('accountCloudStart()');assert.equal(refreshed.run('AccountCloud.state'),'saved');assert.equal(api.accounts.get('teacher').revision,revision);
 await b.run('accountCloudPoll()');assert.equal(b.data.students[0].name,'تعديل دون اتصال');
 refreshed.run("db.students[0].name='من الجهاز الأول';save()");b.run("db.students[0].name='من الجهاز الثاني';save()");await refreshed.run('accountCloudPush()');await b.run('accountCloudPush()');assert.equal(b.run('AccountCloud.state'),'conflict');assert.equal(b.data.students[0].name,'من الجهاز الثاني');await b.run('accountCloudResolve()');assert.equal(b.data.students.length,2);assert.equal(b.run('AccountCloud.state'),'saved');
 api.backupFailure(true);b.run("db.groups.push('مجموعة جديدة');save()");await b.run('accountCloudPush()');assert.notEqual(b.run('AccountCloud.state'),'saved');assert(b.run('AccountCloud.dirty'));api.backupFailure(false);await b.run('accountCloudPush()');assert.equal(b.run('AccountCloud.state'),'saved');
 // An edit made while uploading is retained for a second revision.
 b.ctx.beforeFetch=async(url,options)=>{if(options.method==='PUT'&&url.endsWith('/state')){b.ctx.beforeFetch=null;b.run("db.groups.push('أثناء الرفع');save()");}};
 b.run("db.groups.push('قبل الرفع');save()");await b.run('accountCloudPush()');assert(b.run('AccountCloud.dirty'));await b.run('accountCloudPush()');assert(api.accounts.get('teacher').data.groups.includes('أثناء الرفع'));
 const missing=empty();missing.results.push({id:'missing',pages:{0:'gone'}});const broken=browser(api,'broken',missing);await broken.run('accountCloudStart()');assert.notEqual(broken.run('AccountCloud.state'),'saved');assert.equal(api.accounts.get('broken').revision,0);
 const cross=browser(api,'new-owner',initial);cross.ctx.LocalStore.key='waraqa-pages-v2:/waraqa/:someone-else';await cross.run('accountCloudStart()');assert(cross.run('AccountCloud.blocked'));assert(!api.accounts.has('new-owner'));
 b.ctx.window.WaraqaFirebaseUid='another';await assert.rejects(b.run('accountCloudRequest("state")'),/الحساب/);
 console.log('PASS: cloud migration with original snapshot, images before acknowledgement, two-device isolation, offline/lost-response reload recovery, conflicts preserve both versions, backup failure never claims saved, edits during upload, missing images and foreign local namespace protection.');
})().catch(error=>{console.error(error);process.exitCode=1;});
