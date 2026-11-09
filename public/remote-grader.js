'use strict';
// Only the UI and image transport live here. No pixel-based answer reader or fallback.
let RemoteQueue=Promise.resolve();
const RemoteOrigin=document.querySelector('meta[name="waraqa-grading-origin"]')?.content||'';
const remoteEndpoint=path=>RemoteOrigin+path;
const remoteWait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
function remoteStatus(message){const node=document.querySelector('#remote-status');if(node){node.hidden=false;node.textContent=message;}}
function remoteError(code,status){return ({AUTH_REQUIRED:'سجّل الدخول مجددًا.',AUTH_INVALID:'انتهت جلسة الدخول؛ سجّل الدخول مجددًا.',SUBSCRIPTION_INACTIVE:'الاشتراك منتهٍ أو موقوف.',LICENSE_INACTIVE:'الاشتراك غير مفعل.',LICENSE_EXPIRED:'انتهى الاشتراك.',ORIGIN_DENIED:'تعذر اتصال هذه النسخة بالخادم.',GRADER_BUSY:'الخادم يعالج ورقة أخرى؛ أعد المحاولة.',GRADING_TIMEOUT:'استغرقت القراءة وقتًا طويلًا؛ أعد المحاولة.',RATE_LIMITED:'بلغت حد الطلبات المؤقت؛ انتظر دقيقة.'})[code]||'تعذر التصحيح على الخادم ('+status+'). بقيت بياناتك المحلية محفوظة.';}
async function remoteReadScan(s,e){
 if(!s||!e)throw Error('اختر الاختبار أولًا');
 const revision=s.remoteRevision=(s.remoteRevision||0)+1,canvas=s.canvas,version=s.version||8,p=s.p||0,owner=window.WaraqaFirebaseUid,examSnapshot=JSON.stringify(e.questions),corners=s.corners?.map(x=>({...x}));
 s.remotePending=true;s.remoteReady=false;s.remoteError=null;
 if(typeof retainRemoteInput==='function')try{await retainRemoteInput(s,e);}catch(error){s.remotePending=false;s.remoteError=error.message;throw error;}
 remoteStatus('جارٍ الاتصال بخادم التصحيح…');
 const job=RemoteQueue.then(async()=>{
  if(!window.WaraqaAuthorized||window.WaraqaFirebaseUid!==owner)throw Error('سجّل الدخول للتحقق من الاشتراك.');
  const dataUrl=canvas.toDataURL('image/jpeg',.95),body={version,page:p,exam:{questions:e.questions.map(q=>({type:q.type,text:q.text,options:q.options,answer:q.answer,points:q.points}))},image:{mime:'image/jpeg',base64:dataUrl.split(',')[1]}};
  if(corners)body.corners=corners;
  // Retry only explicit 429 rejections, which have not run the grader.
  await fetch(remoteEndpoint('/healthz'),{signal:AbortSignal.timeout(90000),cache:'no-store'});
  let response,result;
  for(let attempt=0;attempt<3;attempt++){
   if(!window.WaraqaAuthorized||owner!==window.WaraqaFirebaseUid||revision!==s.remoteRevision||canvas!==s.canvas||p!==(s.p||0))throw Error('تغيرت الورقة أو جلسة الدخول؛ أعد القراءة.');
   const token=await window.WaraqaGetIdToken();
   response=await fetch(remoteEndpoint('/v1/grade'),{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
   result=await response.json();
   if(response.status!==429||!['RATE_LIMITED','GRADER_BUSY'].includes(result.error)||attempt===2)break;
   const requested=Number(response.headers?.get('Retry-After')),seconds=Math.max(1,Math.min(65,requested>0?requested:result.error==='RATE_LIMITED'?61:3));
   remoteStatus('الخادم مشغول مؤقتًا؛ ستستأنف الدفعة تلقائيًا بعد '+seconds+' ثانية.');
   await remoteWait(seconds*1000);
  }
  if(!response.ok)throw Error(remoteError(result.error,response.status));
  if(!window.WaraqaAuthorized||owner!==window.WaraqaFirebaseUid||revision!==s.remoteRevision||canvas!==s.canvas||p!==(s.p||0)||version!==(s.version||8)||examSnapshot!==JSON.stringify(e.questions))throw Error('تغيرت الورقة أو جلسة الدخول أثناء التصحيح؛ أعد القراءة.');
  if(result.apiVersion!==1||result.version!==version||result.page!==p||!result.answers||!result.essay)throw Error('استجابة خادم غير متوافقة.');
  const turn=result.orientation?.confident?(4-result.orientation.turn)%4:0;
  if(turn){const rotated=document.createElement('canvas');rotated.width=turn%2?canvas.height:canvas.width;rotated.height=turn%2?canvas.width:canvas.height;const ctx=rotated.getContext('2d');ctx.translate(rotated.width/2,rotated.height/2);ctx.rotate(turn*Math.PI/2);ctx.drawImage(canvas,-canvas.width/2,-canvas.height/2);s.canvas=rotated;s.url=rotated.toDataURL('image/jpeg',.95);}
  if(result.imageSize.width!==s.canvas.width||result.imageSize.height!==s.canvas.height)throw Error('أبعاد الصورة لا تطابق استجابة الخادم.');
  Object.assign(s,{answers:result.answers,essay:result.essay,flags:result.flags,readings:result.readings,bubbleRegistration:result.bubbleRegistration,corners:result.corners,orientationReady:result.orientationReady,remoteReady:true,remoteError:null});
  if(result.error)throw Error('تعذرت محاذاة الورقة؛ حدد الزوايا أو أعد التصوير.');
  remoteStatus('اكتمل التصحيح على الخادم — راجع النتيجة.');return result;
 });
 RemoteQueue=job.catch(()=>{});
 try{return await job;}catch(error){s.remoteReady=false;s.remoteError=error.name==='TimeoutError'?'انتهت مهلة الاتصال؛ أعد المحاولة.':error.message;remoteStatus(s.remoteError);throw Error(s.remoteError);}
 finally{if(s.remoteRevision===revision)s.remotePending=false;}
}
async function remoteReread(){const s=scanState,e=getExam();try{await remoteReadScan(s,e);if(scanState===s){renderScan();if(typeof identifyScanStudent==='function')identifyScanStudent(s);}}catch(error){toast(error.message);}}


// Scanner uploads only. Camera entry points remain disabled until explicitly restored.
let scannerGroup='';
function scan(){
 if(scanState)return renderScan();
 const disabled=currentExam?'':'disabled';
 $('#app').innerHTML=head('التصحيح بالماسح الضوئي','اختر الاختبار، ثم ارفع ملفات الأوراق الممسوحة ضوئيًا.')+`<div class="steps"><div class="step active"><b>١</b> اختر الاختبار</div><div class="step"><b>٢</b> ارفع الملفات</div><div class="step"><b>٣</b> صحّح وراجع</div><div class="step"><b>٤</b> اعتمد النتائج</div></div><section class="panel panel-pad"><div class="form-grid"><label class="field">الاختبار<select id="scan-exam" onchange="currentExam=this.value;scan()"><option value="">اختر اختبارًا</option>${examOptions()}</select></label><label class="field">الصف<select id="scanner-group" onchange="scannerGroup=this.value"><option value="">جميع الصفوف</option>${options(db.groups.map(g=>[g,g]),scannerGroup)}</select></label></div><div class="upload-zone" id="scanner-drop" style="cursor:default"><span class="upload-icon" aria-hidden="true">↑</span><h3>أوراقك الممسوحة ضوئيًا جاهزة للتصحيح</h3><p>ارفع صورة ورقة، أو عدة صور، أو ملف PDF متعدد الصفحات.<br>يمكنك أيضًا اختيار مجلد كامل من جهاز الكمبيوتر.</p><div class="actions" style="justify-content:center;gap:12px;flex-wrap:wrap"><button class="btn" type="button" ${disabled} onclick="document.getElementById('scanner-single').click()">رفع ورقة أو ملف PDF</button><button class="btn gold" type="button" ${disabled} onclick="document.getElementById('scanner-multiple').click()">رفع مجموعة أوراق</button><button class="btn light" type="button" ${disabled} onclick="document.getElementById('scanner-folder').click()">رفع مجلد كامل</button></div><input id="scanner-single" aria-label="رفع ورقة واحدة أو ملف PDF" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" hidden onchange="loadScannerUploads(this)"><input id="scanner-multiple" aria-label="رفع مجموعة أوراق" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" multiple hidden onchange="loadScannerUploads(this)"><input id="scanner-folder" aria-label="رفع مجلد كامل" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" webkitdirectory directory multiple hidden onchange="loadScannerUploads(this)"></div><p class="note">${currentExam?'يمكنك سحب الملفات وإفلاتها في المربع أعلاه.':'اختر الاختبار أولًا لتفعيل أزرار الرفع.'} الصيغ المدعومة: JPG وPNG وPDF. الحد الأقصى ٢٠٠ صفحة في الدفعة، و٤٠ ميغابايت لكل ملف. اختيار المجلد يعتمد على دعم المتصفح.</p><div class="callout">تُرسل صورة الورقة وأسئلة الاختبار ومفتاح الإجابة إلى خادم ورقة لقراءة التظليل، دون إرسال قائمة الطلاب. تُحفظ الصور والنتائج في هذا المتصفح. راجع الإجابات والمقالي قبل اعتماد الدرجة.</div></section><section class="panel panel-pad" style="margin-top:20px"><h2>إعداد الورقة للمسح</h2><p>امسح نموذج ورقة كاملًا دون قص المربعات السوداء الأربع، وباتجاه واضح. اختر اختبارًا مطابقًا للورقة المطبوعة.</p></section>`;
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
