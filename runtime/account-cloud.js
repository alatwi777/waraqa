'use strict';
// Firebase-authenticated cloud sync; local namespaces and the original browser copy survive migration.
const AccountCloud={uid:null,enabled:false,ready:false,busy:false,dirty:false,revision:0,base:null,operation:null,uploaded:new Set(),pending:new Set(),conflict:null,lastSaved:null,backupAt:null,storage:null,error:null,blocked:false,applying:false};
const accountCloudKey=()=> 'waraqa-cloud-sync-v1:'+AccountCloud.uid;
const accountCloudRefs=data=>new Set((data.results||[]).flatMap(r=>Object.values(r.pages||{})));
const accountCloudBound=()=>AccountCloud.uid===window.WaraqaFirebaseUid&&window.WaraqaAuthorized===true;
const accountCloudLocalSave=save;
function accountCloudCache(){
 try{localStorage.setItem(accountCloudKey(),JSON.stringify({revision:AccountCloud.revision,base:AccountCloud.base,dirty:AccountCloud.dirty,operation:AccountCloud.operation,uploaded:[...AccountCloud.uploaded],pending:[...AccountCloud.pending],lastSaved:AccountCloud.lastSaved,backupAt:AccountCloud.backupAt}));return true;}
 catch{AccountCloud.blocked=true;accountCloudNotice('error','تعذر حفظ سجل المزامنة على الجهاز. نزّل نسخة احتياطية ولا تمسح بيانات المتصفح.');return false;}
}
function accountCloudNotice(state,error=null){
 AccountCloud.state=state;AccountCloud.error=error;const profile=$('#cloud-account');if(profile)profile.textContent='حساب ورقة · مزامنة سحابية';const privacy=$('#cloud-privacy');if(privacy)privacy.innerHTML='☁ بيانات مرتبطة بحسابك<small>اضغط حالة الحفظ لمعرفة التفاصيل</small>';const node=$('#cloud-status');if(node){node.textContent=({loading:'جارٍ التحقق من الحفظ السحابي…',local:'محفوظ على الجهاز — بانتظار المزامنة',syncing:'جارٍ حفظ البيانات والصور سحابيًا…',saved:'محفوظ سحابيًا ✓',offline:'غير متصل — التعديلات تنتظر المزامنة',error:'الحفظ السحابي يحتاج مراجعة',conflict:'تعارض بين جهازين — البيانات محفوظة',backup:'محفوظ على الخادم — بانتظار النسخة الخارجية'})[state]||state;node.dataset.state=state;node.onclick=accountCloudDetails;node.tabIndex=0;node.setAttribute?.('role','button');node.onkeydown=event=>{if(event.key==='Enter'||event.key===' ')accountCloudDetails();};}
 const banner=$('#cloud-banner');if(banner){banner.innerHTML=error?'<div class="cloud-banner warning"><div><strong>'+esc(error)+'</strong><p>تظل بيانات هذا الجهاز محفوظة. لا تمسح بيانات الموقع قبل تأكيد اكتمال المزامنة.</p></div><button class="btn light small" onclick="accountCloudRetry()">إعادة المحاولة</button>'+ (AccountCloud.conflict?'<button class="btn small" onclick="accountCloudResolve()">دمج النسختين مع حفظ الاختلافات</button>':'')+'</div>':'';}
}
function accountCloudError(error){accountCloudNotice(error.code==='CLOUD_REVISION_CONFLICT'?'conflict':navigator.onLine===false||error.network?'offline':'error',error.message||'تعذر الحفظ السحابي. بيانات الجهاز محفوظة.');}
async function accountCloudRequest(path,options={}){
 if(!accountCloudBound())throw Error('تغير الحساب أو انتهت جلسة الدخول. سجّل الدخول بالحساب نفسه.');
 const origin=document.querySelector('meta[name="waraqa-grading-origin"]')?.content;
 if(!origin||new URL(origin).protocol!=='https:')throw Error('عنوان التخزين السحابي غير جاهز.');
 const token=await window.WaraqaGetIdToken();if(!accountCloudBound())throw Error('تغير حساب الدخول.');
 let response;try{response=await fetch(origin+'/v1/cloud/'+path,{...options,headers:{Authorization:'Bearer '+token,...(window.WaraqaDeviceId?{'X-Waraqa-Device':window.WaraqaDeviceId}:{}),...(options.headers||{})},cache:'no-store',signal:AbortSignal.timeout(90000)});}catch{throw Object.assign(Error('تعذر الاتصال. ستُستأنف المزامنة بالمرجع المحفوظ عند عودة الاتصال.'),{network:true});}
 const out=await response.json();if(!accountCloudBound())throw Error('تغير حساب الدخول أثناء المزامنة.');
 if(!response.ok){const messages={CLOUD_NOT_CONFIGURED:'التخزين الخارجي لم يُفعّل بعد؛ الحفظ الحالي على جهازك.',CLOUD_REVISION_CONFLICT:'هناك تعديلات أحدث من جهاز آخر. احتفظنا بالنسختين للمراجعة.',CLOUD_FILES_MISSING:'بعض صور الأوراق لم يكتمل رفعها. ستبقى البيانات على الجهاز حتى اكتمالها.',CLOUD_FILE_CAPACITY:'بلغ التخزين السحابي سعته الحالية. تواصل مع المالك؛ بيانات الجهاز محفوظة.',CLOUD_BACKUP_CAPACITY:'مساحة النسخ الخارجية تحتاج توسعة من المالك. بيانات الجهاز محفوظة.',CLOUD_FILE_IMMUTABLE:'هناك صورتان مختلفتان بالمرجع نفسه. احتفظ بنسخة واتصل بالدعم.',SUBSCRIPTION_INACTIVE:'الاشتراك موقوف أو منتهٍ. بيانات جهازك محفوظة.',DEVICE_NOT_REGISTERED:'أُلغي تسجيل الجهاز. بيانات جهازك محفوظة.'};throw Object.assign(Error(messages[out.error]||'تعذر تأكيد الحفظ السحابي والنسخة الخارجية. ستُعاد المحاولة بأمان.'),{code:out.error,status:response.status});}
 return out;
}
function accountCloudChanged(){
 if(!AccountCloud.enabled||AccountCloud.applying)return;AccountCloud.dirty=true;if(!accountCloudCache())return;
 accountCloudNotice(AccountCloud.conflict?'conflict':'local',AccountCloud.conflict?'هناك تعارض يحتاج مراجعة.':null);clearTimeout(AccountCloud.timer);AccountCloud.timer=setTimeout(accountCloudPush,1500);
}
save=function(){const saved=accountCloudLocalSave();if(saved!==false&&AccountCloud.enabled&&!AccountCloud.applying)accountCloudChanged();return saved;};
async function accountCloudPutFile(key,value){await localFilePut(key,value);AccountCloud.pending.add(key);AccountCloud.uploaded.delete(key);if(!accountCloudCache())throw Error('تعذر حفظ مرجع الصورة للمزامنة.');}
async function accountCloudGetFile(key){let value=await localFileGet(key);if(value)return value;const out=await accountCloudRequest('files/'+encodeURIComponent(key));await localFilePut(key,out.dataUrl);return out.dataUrl;}
function accountCloudApply(data){
 const before=db;AccountCloud.applying=true;db=cloudClone(data);try{if(accountCloudLocalSave()===false){db=before;AccountCloud.blocked=true;throw Error('تعذر حفظ البيانات المسترجعة محليًا. احتفظنا بنسخة الجهاز.');}}finally{AccountCloud.applying=false;}
 if(typeof route==='function')route();
}
function accountCloudCanRefresh(){return !scanState&&!$('#modal')?.open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);}
async function accountCloudAccept(out){
 if(out.uid!==AccountCloud.uid)throw Error('استجابة الحساب غير مطابقة.');
 AccountCloud.storage=out.storage;AccountCloud.backupAt=out.backupAt;AccountCloud.lastSaved=out.updatedAt;
 const remote=out.data||cloudEmpty();
 if(AccountCloud.dirty){
  if(out.revision!==AccountCloud.revision){AccountCloud.conflict=out;accountCloudNotice('conflict','هناك تعديلات من جهاز آخر. دمج النسختين يحفظ الاختلافات للمراجعة.');return;}
 }else if(!cloudEqual(db,remote)){
  if(!accountCloudCanRefresh()){accountCloudNotice('local','توجد تحديثات من الجهاز الآخر. ستظهر بعد إنهاء التحرير.');return;}
  accountCloudApply(remote);
 }
 AccountCloud.revision=out.revision;AccountCloud.base=cloudClone(remote);for(const key of accountCloudRefs(remote))AccountCloud.uploaded.add(key);accountCloudCache();
 accountCloudNotice(AccountCloud.dirty?'local':out.backupPending?'backup':'saved');
}
async function accountCloudPush(){
 if(!AccountCloud.ready||AccountCloud.busy||AccountCloud.conflict||AccountCloud.blocked||LocalStore.blocked||!AccountCloud.dirty||!accountCloudBound())return;
 AccountCloud.busy=true;accountCloudNotice('syncing');
 try{
  let operation=AccountCloud.operation;
  if(!operation){
   const snapshot=cloudClone(db);
   for(const key of accountCloudRefs(snapshot)){
    if(AccountCloud.uploaded.has(key)&&!AccountCloud.pending.has(key))continue;
    const dataUrl=await localFileGet(key);if(!dataUrl)throw Error('صورة ورقة غير موجودة على هذا الجهاز ولم تُرفع سابقًا. استعد الصورة من نسخة احتياطية لإكمال النقل.');
    await accountCloudRequest('files/'+encodeURIComponent(key),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataUrl})});
    AccountCloud.uploaded.add(key);AccountCloud.pending.delete(key);if(!accountCloudCache())return;
   }
   operation={operationId:crypto.randomUUID(),baseRevision:AccountCloud.revision,data:snapshot};AccountCloud.operation=operation;if(!accountCloudCache())return;
  }
  const out=await accountCloudRequest('state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(operation)});
  if(out.uid!==AccountCloud.uid||!Number.isSafeInteger(out.operationRevision))throw Error('استجابة المزامنة غير مطابقة.');
  AccountCloud.base=cloudClone(operation.data);AccountCloud.revision=out.operationRevision;AccountCloud.operation=null;AccountCloud.dirty=!cloudEqual(db,operation.data);AccountCloud.lastSaved=out.updatedAt;AccountCloud.backupAt=out.backupAt;AccountCloud.storage=out.storage;if(!accountCloudCache())return;
  if(out.revision!==AccountCloud.revision)await accountCloudAccept(out);
  else accountCloudNotice(AccountCloud.dirty?'local':out.backupPending?'backup':'saved');
 }catch(error){
  if(error.code==='CLOUD_REVISION_CONFLICT'){
   try{AccountCloud.conflict=await accountCloudRequest('state');AccountCloud.operation=null;accountCloudCache();}catch{}
  }
  accountCloudError(error);
 }finally{AccountCloud.busy=false;if(AccountCloud.dirty&&!AccountCloud.conflict&&!AccountCloud.blocked)AccountCloud.timer=setTimeout(accountCloudPush,10000);}
}
async function accountCloudPoll(){
 if(!AccountCloud.ready||AccountCloud.busy||AccountCloud.blocked||LocalStore.blocked||!accountCloudBound()||document.visibilityState==='hidden')return;
 if(AccountCloud.dirty)return accountCloudPush();AccountCloud.busy=true;try{await accountCloudAccept(await accountCloudRequest('state'));}catch(e){accountCloudError(e);}finally{AccountCloud.busy=false;}
}
async function accountCloudResolve(){
 if(!AccountCloud.conflict||AccountCloud.busy||AccountCloud.blocked)return;
 const latest=AccountCloud.conflict,merged=mergeAccountData(AccountCloud.base||cloudEmpty(),db,latest.data||cloudEmpty());
 // Recovery copy is written before replacing any in-memory or on-device data.
 try{localStorage.setItem(accountCloudKey()+':recovery',JSON.stringify({data:db,remote:latest,savedAt:new Date().toISOString()}));}catch{return accountCloudNotice('error','لا توجد مساحة لحفظ نسخة ما قبل الدمج. نزّل نسخة احتياطية أولًا.');}
 accountCloudApply(merged.data);AccountCloud.base=cloudClone(latest.data||cloudEmpty());AccountCloud.revision=latest.revision;AccountCloud.operation=null;AccountCloud.conflict=null;AccountCloud.dirty=true;for(const key of accountCloudRefs(latest.data||cloudEmpty()))AccountCloud.uploaded.add(key);accountCloudCache();
 toast(merged.conflicts?'حُفظت نسختا السجلات المختلفة للمراجعة.':'دُمجت تعديلات الجهازين.');await accountCloudPush();
}
async function accountCloudStart(){
 if(AccountCloud.enabled||!window.WaraqaAuthorized||!window.WaraqaFirebaseUid||LocalStore.blocked)return;
 if(document.querySelector('meta[name="waraqa-cloud-storage"]')?.content!=='enabled')return;
 AccountCloud.enabled=true;AccountCloud.uid=window.WaraqaFirebaseUid;accountCloudNotice('loading');
 let cache;try{cache=JSON.parse(localStorage.getItem(accountCloudKey())||'null');}catch{AccountCloud.blocked=true;return accountCloudNotice('error','سجل المزامنة الموجود غير صالح. لن نستبدل بياناتك. نزّل نسخة احتياطية واتصل بالدعم.');}
 if(cache){AccountCloud.revision=cache.revision||0;AccountCloud.base=cache.base||cloudEmpty();AccountCloud.dirty=!!cache.operation||!!cache.dirty||!cloudEqual(db,AccountCloud.base);AccountCloud.operation=cache.operation||null;AccountCloud.uploaded=new Set(cache.uploaded||[]);AccountCloud.pending=new Set(cache.pending||[]);AccountCloud.lastSaved=cache.lastSaved;AccountCloud.backupAt=cache.backupAt;}
 else {AccountCloud.base=cloudEmpty();AccountCloud.dirty=hasAccountData(db)||!cloudEqual(db,cloudEmpty());}
 if(!cache&&(hasAccountData(db)||!cloudEqual(db,cloudEmpty()))){try{const key='waraqa-before-cloud-'+AccountCloud.uid;if(!await localFileGet(key))await localFilePut(key,JSON.stringify({version:1,db:cloudClone(db),sourceKey:LocalStore.key,date:new Date().toISOString()}));}catch{AccountCloud.blocked=true;return accountCloudNotice('error','تعذر حفظ نسخة ما قبل النقل. نزّل نسخة احتياطية أولًا.');}}
 const sitePath=new URL('.',location.href).pathname,legacyOwner=localStorage.getItem('waraqa-pages-owner:'+sitePath),ownKey='waraqa-pages-v2:'+sitePath+':'+AccountCloud.uid;
 if(LocalStore.key!==ownKey&&!(LocalStore.key==='waraqa-pages-v1:'+sitePath&&legacyOwner===AccountCloud.uid)){
  AccountCloud.blocked=true;return accountCloudNotice('error','هذه البيانات المحلية مرتبطة بمساحة أخرى. لن ننقلها تلقائيًا إلى الحساب الحالي. احتفظ بنسخة وتواصل مع المالك.');
 }
 window.WaraqaCloud={changed:accountCloudChanged,filePut:accountCloudPutFile,fileGet:accountCloudGetFile};cloudDetails=accountCloudDetails;AccountCloud.ready=true;accountCloudCache();
 try{
  const out=await accountCloudRequest('state');AccountCloud.storage=out.storage;
  if(AccountCloud.operation){await accountCloudPush();return;}
  if(!cache&&AccountCloud.dirty&&out.revision>0){AccountCloud.conflict=out;accountCloudNotice('conflict','بيانات هذا المتصفح وبيانات الحساب موجودتان. ادمجهما مع الحفاظ على النسختين قبل الحفظ.');return;}
  await accountCloudAccept(out);if(AccountCloud.dirty)await accountCloudPush();
 }catch(e){accountCloudError(e);}
}
async function accountCloudRetry(){if(!AccountCloud.enabled)return accountCloudStart();if(AccountCloud.conflict)return accountCloudResolve();if(AccountCloud.dirty)return accountCloudPush();return accountCloudPoll();}
function accountCloudDetails(){
 const c=AccountCloud;
 modal('الحفظ والمزامنة',`<p class="sub">بياناتك وصور أوراقك مرتبطة بحساب ورقة، وتظهر على الجهازين المسجّلين بعد اكتمال المزامنة.</p><div class="callout">الحفظ والمزامنة يعملان تلقائيًا. لا تحتاج إلى تنزيل ملف للانتقال إلى جهازك الآخر. وتُحفظ نسخة احتياطية مشفرة خارج خادم الموقع لاستعادة البيانات عند الحاجة.</div><p class="note">آخر حفظ سحابي: ${c.lastSaved?new Date(c.lastSaved).toLocaleString('ar-SA'):'لم يتم بعد'}<br>آخر نسخة احتياطية مؤكدة: ${c.backupAt?new Date(c.backupAt).toLocaleString('ar-SA'):'لم يتم بعد'}</p>${c.error?'<p class="note">'+esc(c.error)+'</p>':''}<div class="actions"><button class="btn" onclick="closeModal();accountCloudRetry()">مزامنة</button><button class="btn light" onclick="accountCloudBackups()">النسخ الاحتياطي</button></div><p class="note">التعديلات دون اتصال تبقى على الجهاز حتى تأكيد الحفظ السحابي. عند اختلاف بيانات الجهازين تظهر مراجعة للتعارض.</p>`);
}
function accountCloudBackups(){
 modal('النسخ الاحتياطي',`<p class="sub">يعمل النسخ الاحتياطي الخارجي تلقائيًا مع الحفظ السحابي. تنزيل نسخة على جهازك خيار إضافي، ولا يلزم للمزامنة أو الانتقال بين أجهزتك.</p><div class="callout"><b>نسخة بياناتك الحالية</b><p>ملف يحتوي على بياناتك الحالية وصور الأوراق المتاحة. تنزيله لا يحذف بياناتك ولا يستبدلها.</p><button class="btn" onclick="backup()">تنزيل نسخة على جهازي</button></div><details style="margin-top:18px"><summary style="cursor:pointer">خيارات إضافية: بيانات ما قبل الحفظ السحابي</summary><p class="note">نسخة ثابتة من بيانات هذا المتصفح قبل أول نقل إلى الحفظ السحابي، دون الإضافات اللاحقة. تتوفر في المتصفح الأصلي إذا بقيت نسخة ما قبل النقل محفوظة فيه.</p><button class="btn light" onclick="accountCloudLegacyBackup()">تنزيل بياناتي قبل الحفظ السحابي</button></details><p class="note">تنزيل أي نسخة لا يعيد بيانات قديمة تلقائيًا؛ الاستعادة عملية منفصلة تتطلب تأكيدك. تُحفظ الإصدارات السابقة ٣٠ يومًا، وقد تبقى النسخ الاحتياطية ٣٠ يومًا بعد حذف الحساب.</p>`);
}
async function accountCloudLegacyBackup(){
 try{const text=await localFileGet('waraqa-before-cloud-'+AccountCloud.uid);if(!text)return toast('لا توجد نسخة سابقة للنقل في هذا المتصفح.');const saved=JSON.parse(text),files={};for(const key of accountCloudRefs(saved.db)){const value=await localFileGet(key);if(!value)throw Error('صورة من النسخة السابقة غير موجودة على الجهاز.');files[key]=value;}download('waraqa-before-cloud.json',JSON.stringify({version:1,db:saved.db,files}),'application/json');}catch(e){toast(e.message||'تعذر تنزيل نسخة ما قبل النقل.');}
}
window.addEventListener('waraqa-authorized',accountCloudStart);window.addEventListener('online',()=>accountCloudRetry());window.addEventListener('focus',accountCloudPoll);window.addEventListener('beforeunload',event=>{if(AccountCloud.enabled&&(AccountCloud.dirty||AccountCloud.operation)){event.preventDefault();event.returnValue='';}});setInterval(accountCloudPoll,15000);
if(window.WaraqaLoadedUid)void accountCloudStart();
