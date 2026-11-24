'use strict';
// Only the UI and image transport live here. No pixel-based answer reader or fallback.
let RemoteActive=0;const RemoteWaiting=[];
async function runRemoteTask(task){if(RemoteActive>=5)await new Promise(resolve=>RemoteWaiting.push(resolve));else RemoteActive++;try{return await task();}finally{const next=RemoteWaiting.shift();if(next)next();else RemoteActive--;}}
const RemoteOrigin=document.querySelector('meta[name="waraqa-grading-origin"]')?.content||'';
const remoteEndpoint=path=>RemoteOrigin+path;
let healthRequest=null,healthExpires=0;
function gradingCapabilities(){
 if(!healthRequest||Date.now()>=healthExpires){
  healthExpires=Date.now()+60000;
  const request=fetch(remoteEndpoint('/healthz'),{signal:AbortSignal.timeout(30000),cache:'no-store'})
   .then(response=>{
    if(response.ok===false)throw Error('تعذر التحقق من خدمة التصحيح.');
    return typeof response.json==='function'?response.json():{};
   }).catch(error=>{if(healthRequest===request)healthRequest=null;throw error;});
  healthRequest=request;
 }
 return healthRequest;
}
// Keep network backoff independent of a hidden tab's window timer budget.
let RemoteDelayWorker=null,RemoteDelaySerial=0;const RemoteDelays=new Map();
function remoteWait(milliseconds){return new Promise(resolve=>{
 const fallback=()=>setTimeout(resolve,milliseconds);
 try{
  if(!RemoteDelayWorker){
   RemoteDelayWorker=new Worker('background-delay.js?v=1');
   RemoteDelayWorker.onmessage=event=>{const done=RemoteDelays.get(event.data);if(done){RemoteDelays.delete(event.data);done.resolve();}};
   RemoteDelayWorker.onerror=()=>{RemoteDelayWorker?.terminate();RemoteDelayWorker=null;for(const task of RemoteDelays.values())setTimeout(task.resolve,Math.max(0,task.deadline-Date.now()));RemoteDelays.clear();};
  }
  const id=++RemoteDelaySerial;RemoteDelays.set(id,{resolve,deadline:Date.now()+milliseconds});RemoteDelayWorker.postMessage({id,milliseconds});
 }catch{fallback();}
});}
function scanRequestSignal(s,ms){
 const timeout=AbortSignal.timeout(ms);
 return s.batchSignal?AbortSignal.any([s.batchSignal,timeout]):timeout;
}
function waitForScan(s,task){
 const signal=s.batchSignal;
 if(!signal)return task;
 signal.throwIfAborted();
 return new Promise((resolve,reject)=>{
   const stop=()=>reject(signal.reason);
   signal.addEventListener('abort',stop,{once:true});
   task.then(resolve,reject).finally(()=>signal.removeEventListener('abort',stop));
 });
}
function remoteStatus(message){const node=document.querySelector('#remote-status');if(node){node.hidden=false;node.textContent=message;}}
function remoteError(code,status){return ({AUTH_REQUIRED:'سجّل الدخول مجددًا.',AUTH_INVALID:'انتهت جلسة الدخول؛ سجّل الدخول مجددًا.',SUBSCRIPTION_INACTIVE:'الاشتراك منتهٍ أو موقوف.',LICENSE_INACTIVE:'الاشتراك غير مفعل.',LICENSE_EXPIRED:'انتهى الاشتراك.',ORIGIN_DENIED:'تعذر اتصال هذه النسخة بالخادم.',GRADER_BUSY:'الخادم يعالج ورقة أخرى؛ أعد المحاولة.',GRADING_TIMEOUT:'استغرقت القراءة وقتًا طويلًا؛ أعد المحاولة.',RATE_LIMITED:'بلغت حد الطلبات المؤقت؛ انتظر دقيقة.'})[code]||'تعذر التصحيح على الخادم ('+status+'). بقيت بياناتك المحلية محفوظة.';}
// A stable request ID is saved locally BEFORE upload. Network retries address the same job.
async function durableRemoteScan(s,e,body,owner,ensureCurrent){
 const config=JSON.stringify({version:body.version,page:body.page,questions:body.exam.questions,corners:body.corners||null});
 const record=db.results.find(r=>r.id===(s.savedResultId||s.remoteRetainedId));
 if(!record)throw Error('تعذر حفظ مرجع طلب التصحيح محليًا؛ لم تُرسل الورقة.');
 const imageKey=record.pages?.[0],previous=record.remoteJob;
 let jobId=previous?.owner===owner&&previous.config===config&&previous.imageKey===imageKey&&(!s.remoteJobImage||s.remoteJobImage===body.image.base64)?previous.id:null;
 let mustSubmit=!jobId;
 async function rememberJob(){
  const bytes=new TextEncoder().encode(JSON.stringify([owner,body]));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  jobId=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const currentJob=record.remoteJob;
  record.remoteJob={id:jobId,owner,config,imageKey};
  try{
   if(save()===false)throw Error('تعذر حفظ مرجع طلب التصحيح محليًا؛ لم تُرسل الورقة.');
  }catch(error){
   if(currentJob===undefined)delete record.remoteJob;else record.remoteJob=currentJob;
   s.storageFailure=true;
   throw error;
  }
  if(typeof flushLocalChanges==='function'&&!await flushLocalChanges()){
   s.storageFailure=true;
   throw Error('تعذر تثبيت مرجع التصحيح محليًا؛ لم تُرسل الورقة.');
  }
 }
 if(!jobId)await rememberJob();
 s.remoteJobImage=body.image.base64;
 const deadline=Date.now()+15*60*1000;let networkFailures=0;
 while(Date.now()<deadline){
  s.batchSignal?.throwIfAborted();ensureCurrent();
  let response,data;
  try{
   const token=await waitForScan(s,window.WaraqaGetIdToken());
   s.batchSignal?.throwIfAborted();
   response=await fetch(remoteEndpoint('/v1/grade-jobs'+(mustSubmit?'':'/'+jobId)),{method:mustSubmit?'POST':'GET',headers:{Authorization:'Bearer '+token,...(mustSubmit?{'Content-Type':'application/json'}:{}),...(window.WaraqaDeviceId?{'X-Waraqa-Device':window.WaraqaDeviceId}:{})},...(mustSubmit?{body:JSON.stringify(body)}:{}),signal:scanRequestSignal(s,30000)});
   data=await response.json();networkFailures=0;
  }catch(error){
   s.batchSignal?.throwIfAborted();
   // A lost POST response is ambiguous: query the saved ID before ever resubmitting.
   mustSubmit=false;networkFailures++;
   if(networkFailures>=8)throw Error('انقطع الاتصال. الورقة ومرجع طلبها محفوظان؛ أعد التصحيح لاستلام النتيجة نفسها.');
   remoteStatus('انقطع الاتصال مؤقتًا؛ جارٍ التحقق من طلبك المحفوظ…');await waitForScan(s,remoteWait(Math.min(10000,networkFailures*2000)));continue;
  }
  if(response.status===404&&!mustSubmit){await rememberJob();mustSubmit=true;continue;}
  if(response.status===429){remoteStatus('الطابور مشغول؛ الورقة محفوظة وستُعاد المحاولة تلقائيًا.');await waitForScan(s,remoteWait(Math.min(65000,Math.max(2000,Number(response.headers?.get('Retry-After')||3)*1000))));continue;}
  if(response.status>=500){mustSubmit=false;await waitForScan(s,remoteWait(3000));continue;}
  if(!response.ok)throw Error(remoteError(data.error,response.status));
  if(data.jobId!==jobId)throw Error('مرجع استجابة التصحيح غير مطابق للورقة.');
  mustSubmit=false;
  if(data.state==='done')return data.result;
  if(data.state==='failed')throw Error(remoteError(data.error,data.status||503));
  if(!['queued','running'].includes(data.state))throw Error('حالة طلب التصحيح غير متوافقة.');
  remoteStatus(data.state==='queued'?'طلبك محفوظ في طابور التصحيح…':'جارٍ تصحيح طلبك المحفوظ…');await waitForScan(s,remoteWait(500));
 }
 throw Error('انتهت مهلة المتابعة. الورقة ومرجع طلبها محفوظان؛ أعد التصحيح لاستلام النتيجة.');
}
async function remoteReadScan(s,e){
 if(!s||!e)throw Error('اختر الاختبار أولًا');
 const revision=s.remoteRevision=(s.remoteRevision||0)+1,canvas=s.canvas,version=s.version||8,p=s.p||0,owner=window.WaraqaFirebaseUid,examSnapshot=JSON.stringify(e.questions),corners=s.corners?.map(x=>({...x}));
 s.remotePending=true;s.remoteReady=false;s.remoteError=null;
 if(typeof retainRemoteInput==='function')try{await retainRemoteInput(s,e);if(typeof flushLocalChanges==='function'&&!await flushLocalChanges())throw Error('تعذر تثبيت الحفظ على الجهاز؛ لم تُرسل الورقة.');}catch(error){s.storageFailure=true;s.remotePending=false;s.remoteError=error.message;throw error;}
 const statusNode=document.querySelector('#remote-status');
 if(statusNode) statusNode.hidden=true;
 const job=runRemoteTask(async()=>{
  if(!window.WaraqaAuthorized||window.WaraqaFirebaseUid!==owner)throw Error('سجّل الدخول للتحقق من الاشتراك.');
  const dataUrl=canvas.toDataURL('image/jpeg',.85),body={version,page:p,exam:{questions:e.questions.map(q=>({type:q.type,text:q.text,options:q.options,answer:q.answer,points:q.points}))},image:{mime:'image/jpeg',base64:dataUrl.split(',')[1]}};
  if(corners)body.corners=corners;
  // Retry only explicit 429 rejections, which have not run the grader.
  const googleLane=s.dispatchGoogle === true;
  const health=googleLane?{durableJobs:false}:await waitForScan(s,gradingCapabilities());
  let response,result;const retryUntil=Date.now()+15*60*1000;
  if(health.durableJobs){
   result=await durableRemoteScan(s,e,body,owner,()=>{if(!window.WaraqaAuthorized||owner!==window.WaraqaFirebaseUid||revision!==s.remoteRevision||canvas!==s.canvas||p!==(s.p||0)||examSnapshot!==JSON.stringify(e.questions))throw Error('تغيرت الورقة أو جلسة الدخول؛ أعد القراءة.');});
   response={ok:true};
  }else for(let attempt=0;attempt<60;attempt++){
   if(!window.WaraqaAuthorized||owner!==window.WaraqaFirebaseUid||revision!==s.remoteRevision||canvas!==s.canvas||p!==(s.p||0))throw Error('تغيرت الورقة أو جلسة الدخول؛ أعد القراءة.');
   const token=await waitForScan(s,window.WaraqaGetIdToken());
   s.batchSignal?.throwIfAborted();
   response=await fetch(googleLane?'https://waraqa-dispatch-test04-481064076419.europe-west1.run.app/v1/grade/google':remoteEndpoint('/v1/grade'),{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(window.WaraqaDeviceId?{'X-Waraqa-Device':window.WaraqaDeviceId}:{})},body:JSON.stringify(body),signal:scanRequestSignal(s,90000)});
   result=await response.json();
   if(response.status!==429||!['RATE_LIMITED','GRADER_BUSY'].includes(result.error)||attempt===59||Date.now()>=retryUntil)break;
   const requested=Number(response.headers?.get('Retry-After')),minimum=Math.max(1,Math.min(65,requested>0?requested:result.error==='RATE_LIMITED'?61:3)),seconds=result.error==='GRADER_BUSY'?Math.max(minimum,Math.min(30,3+attempt*2+Math.random()*2)):minimum;
   remoteStatus('طلبك محفوظ؛ ستستأنف الدفعة تلقائيًا بعد '+Math.ceil(seconds)+' ثانية.');
   await waitForScan(s,remoteWait(seconds*1000));
  }
  if(!response.ok)throw Error(remoteError(result.error,response.status));
  if(!window.WaraqaAuthorized||owner!==window.WaraqaFirebaseUid||revision!==s.remoteRevision||canvas!==s.canvas||p!==(s.p||0)||version!==(s.version||8)||examSnapshot!==JSON.stringify(e.questions))throw Error('تغيرت الورقة أو جلسة الدخول أثناء التصحيح؛ أعد القراءة.');
  if(result.apiVersion!==1||result.version!==version||result.page!==p||!result.answers||!result.essay)throw Error('استجابة خادم غير متوافقة.');
  const turn=result.orientation?.confident?(4-result.orientation.turn)%4:0;
  if(turn){const rotated=document.createElement('canvas');rotated.width=turn%2?canvas.height:canvas.width;rotated.height=turn%2?canvas.width:canvas.height;const ctx=rotated.getContext('2d');ctx.translate(rotated.width/2,rotated.height/2);ctx.rotate(turn*Math.PI/2);ctx.drawImage(canvas,-canvas.width/2,-canvas.height/2);s.canvas=rotated;s.url=rotated.toDataURL('image/jpeg',.95);}
  if(result.imageSize.width!==s.canvas.width||result.imageSize.height!==s.canvas.height)throw Error('أبعاد الصورة لا تطابق استجابة الخادم.');
  Object.assign(s,{answers:result.answers,essay:result.essay,flags:result.flags,readings:result.readings,bubbleRegistration:result.bubbleRegistration,corners:result.corners,orientationReady:result.orientationReady,remoteReady:true,remoteError:null});
  if(result.error)throw Error('تعذرت محاذاة الورقة؛ حدد الزوايا أو أعد التصوير.');
  if(typeof batchProcessing==='undefined'||!batchProcessing) remoteStatus('اكتمل التصحيح على الخادم — راجع النتيجة.');return result;
 });

 try{return await job;}catch(error){s.remoteReady=false;s.remoteError=error.name==='TimeoutError'?'انتهت مهلة الاتصال؛ أعد المحاولة.':error.message;remoteStatus(s.remoteError);throw Error(s.remoteError);}
 finally{if(s.remoteRevision===revision)s.remotePending=false;}
}
async function remoteReread(){const s=scanState,e=getExam();try{await remoteReadScan(s,e);if(scanState===s){renderScan();if(typeof identifyScanStudent==='function')identifyScanStudent(s);}}catch(error){toast(error.message);}}


// Scanner uploads only. Camera entry points remain disabled until explicitly restored.
let scannerGroup='';
function scan(){
 if(scanState)return renderScan();
 const disabled=currentExam?'':'disabled';
 $('#app').innerHTML=head('التصحيح بالماسح الضوئي','اختر الاختبار، ثم ارفع ملفات الأوراق الممسوحة ضوئيًا.')+`<div class="steps"><div class="step active"><b>١</b> اختر الاختبار</div><div class="step"><b>٢</b> ارفع الملفات</div><div class="step"><b>٣</b> صحّح وراجع</div><div class="step"><b>٤</b> اعتمد النتائج</div></div><section class="panel panel-pad"><div class="form-grid"><label class="field">الاختبار<select id="scan-exam" onchange="currentExam=this.value;scan()"><option value="">اختر اختبارًا</option>${examOptions()}</select></label><label class="field">الصف<select id="scanner-group" onchange="scannerGroup=this.value"><option value="">جميع الصفوف</option>${options(db.groups.map(g=>[g,g]),scannerGroup)}</select></label></div><div class="upload-zone" id="scanner-drop" style="cursor:default"><span class="upload-icon" aria-hidden="true">↑</span><h3>أوراقك الممسوحة ضوئيًا جاهزة للتصحيح</h3><p>ارفع صورة ورقة، أو عدة صور، أو ملف PDF متعدد الصفحات.<br>يمكنك أيضًا اختيار مجلد كامل من جهاز الكمبيوتر.</p><div class="actions" style="justify-content:center;gap:12px;flex-wrap:wrap"><button class="btn" type="button" ${disabled} onclick="document.getElementById('scanner-single').click()">رفع ورقة أو ملف PDF</button><button class="btn gold" type="button" ${disabled} onclick="document.getElementById('scanner-multiple').click()">رفع مجموعة أوراق</button><button class="btn light" type="button" ${disabled} onclick="document.getElementById('scanner-folder').click()">رفع مجلد كامل</button></div><input id="scanner-single" aria-label="رفع ورقة واحدة أو ملف PDF" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" hidden onchange="loadScannerUploads(this)"><input id="scanner-multiple" aria-label="رفع مجموعة أوراق" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" multiple hidden onchange="loadScannerUploads(this)"><input id="scanner-folder" aria-label="رفع مجلد كامل" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" webkitdirectory directory multiple hidden onchange="loadScannerUploads(this)"></div><p class="note">${currentExam?'يمكنك سحب الملفات وإفلاتها في المربع أعلاه.':'اختر الاختبار أولًا لتفعيل أزرار الرفع.'} الصيغ المدعومة: JPG وPNG وPDF. الحد الأقصى ٣٠٠ صفحة في الدفعة، و٤٠ ميغابايت لكل ملف. اختيار المجلد يعتمد على دعم المتصفح.</p><div class="callout">تُرسل صورة الورقة وأسئلة الاختبار ومفتاح الإجابة إلى خادم ورقة لقراءة التظليل، دون إرسال قائمة الطلاب. تُحفظ الصور والنتائج في هذا المتصفح. يحتفظ الخادم بالطلب مؤقتًا لاستعادته عند الانقطاع؛ تُزال صورة الطلب بعد معالجته، وتبقى النتيجة قابلة للاسترجاع لمدة ٢٤ ساعة. راجع الإجابات والمقالي قبل اعتماد الدرجة.</div></section><section class="panel panel-pad" style="margin-top:20px"><h2>إعداد الورقة للمسح</h2><p>امسح نموذج ورقة كاملًا دون قص المربعات السوداء الأربع، وباتجاه واضح. اختر اختبارًا مطابقًا للورقة المطبوعة.</p></section>`;
 const zone=document.querySelector('#scanner-drop');
 zone.ondragover=event=>{event.preventDefault();zone.style.background='#eaf2df';};
 zone.ondragleave=()=>zone.style.background='';
 zone.ondrop=event=>{event.preventDefault();zone.style.background='';loadScannerFiles(event.dataTransfer.files);};
}
async function loadScannerUploads(input){const files=Array.from(input.files||[]);input.value='';await loadScannerFiles(files);}
async function loadScannerFiles(files){
 if(!currentExam)return toast('اختر الاختبار أولًا');
 try{await loadScans(files);}catch(error){toast(error.message||'تعذر رفع الملفات. أعد المحاولة.');}
}
function scannerCameraDisabled(){toast('التصوير بالكاميرا متوقف مؤقتًا. ارفع ملفات الماسح الضوئي من قسم التصحيح.');}
if(typeof openPaperCamera==='function')openPaperCamera=scannerCameraDisabled;
if(typeof openDocumentBatchSetup==='function')openDocumentBatchSetup=scannerCameraDisabled;
if(typeof startDocumentBatch==='function')startDocumentBatch=scannerCameraDisabled;
if(typeof openDocumentBatchCamera==='function')openDocumentBatchCamera=scannerCameraDisabled;
if(typeof connectPaperCamera==='function')connectPaperCamera=scannerCameraDisabled;

// Retain a local ungraded record before sending a scan, so an outage does not lose it.
async function retainRemoteInput(s,e){
 if(s.savedResultId||s.remoteRetainedId&&db.results.some(r=>r.id===s.remoteRetainedId))return;
 if(s.remoteRetaining)return s.remoteRetaining;
 s.remoteRetaining=(async()=>{
  const id=uid(),key='scanner-input-'+id,record={id,exam:e.id,snapshot:{...JSON.parse(JSON.stringify(e)),paperVersion:s.version||8},student:'',name:s.name||'ورقة مرفوعة',number:'',group:s.captureGroup||'',captureGroup:s.captureGroup||'',capturePage:s.p||0,captureStatus:'ungraded',source:'scanner',pages:{0:key},answers:{},essay:{},reviewed:{},date:new Date().toISOString()};
  await filePut(key,s.url);db.results.push(record);
  try{if(save()===false)throw Error('تعذر حفظ الورقة محليًا؛ لم تُرسل إلى الخادم. تحقق من مساحة الجهاز.');}catch(error){db.results=db.results.filter(r=>r.id!==id);throw error;}
  s.remoteRetainedId=id;s.remoteInputUrl=s.url;
 })();
 try{await s.remoteRetaining;}finally{s.remoteRetaining=null;}
}
function cleanupRemoteInput(s,r){
 if(!s.remoteRetainedId||s.remoteRetainedId===r.id)return;
 const before=db.results;db.results=before.filter(item=>item.id!==s.remoteRetainedId);
 if(save()===false){db.results=before;return;}
 s.remoteRetainedId=null;s.remoteInputUrl=null;
}
