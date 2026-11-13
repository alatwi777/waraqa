'use strict';
// Capture first, grade later. Images use the same local storage and backup as results.
let documentBatchGroup = '', capturedGrading = false;
function captureRoster(group) { return db.students.filter(st => !group || st.group === group); }
function openDocumentBatchSetup() {
  if (!db.exams.length) return toast('أنشئ الاختبار أولًا');
  modal('مسح ضوئي متتابع', `<p class="sub">اختر الاختبار والصف، ثم صوّر الأوراق تباعًا. تظهر الصور في النتائج بحالة «غير مصححة».</p><label class="field">الاختبار<select id="document-batch-exam">${options(db.exams.map(e => [e.id,e.title]),currentExam || db.exams[0].id)}</select></label><label class="field">الصف<select id="document-batch-group"><option value="">الكل</option>${options(db.groups.map(g=>[g,g]),documentBatchGroup)}</select></label><div class="callout">ضع الورقة كاملة فوق سطح أغمق منها، وثبّت الهاتف. يُحدَّد إطار الورقة تلقائيًا دون نقاط خضراء. بعد صوت الالتقاط بدّل الورقة.</div><button class="btn gold" type="button" onclick="startDocumentBatch()">بدء تصوير الأوراق</button>`);
}
async function startDocumentBatch() {
  const examId = $('#document-batch-exam')?.value, group = $('#document-batch-group')?.value || '';
  const e = db.exams.find(e=>e.id===examId); if (!e?.questions?.length) return toast('اختر اختبارًا يحتوي على أسئلة');
  if (!navigator.mediaDevices?.getUserMedia) return toast('الكاميرا المباشرة غير مدعومة في هذا المتصفح');
  currentExam = e.id; documentBatchGroup = group; unlockPaperCameraAudio();
  const setup = $('#modal');
  if (setup?.open) await new Promise(resolve=>{setup.addEventListener('close',resolve,{once:true});closeModal()});
  await openDocumentBatchCamera(e, group);
}
async function openDocumentBatchCamera(exam, group) {
  stopPaperCamera(); unlockPaperCameraAudio();
  const shell=document.createElement('section');shell.id='paper-camera-shell';shell.className='paper-camera-shell camera-shell document-batch-camera';shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','مسح ضوئي متتابع');
  shell.innerHTML=`<div class="camera-shell-head"><h2>مسح متتابع · <span id="document-batch-count">٠ ورقة محفوظة</span></h2><button class="camera-shell-close" type="button" onclick="finishDocumentBatch()" aria-label="إنهاء التصوير">×</button></div><div class="camera-shell-content"><div class="paper-camera-stage"><video id="paper-camera-video" autoplay muted playsinline></video><canvas id="paper-camera-overlay" aria-hidden="true"></canvas><div id="paper-camera-start"><span>جارٍ تشغيل الكاميرا…</span></div></div><p id="paper-camera-status" class="camera-status" role="status" aria-live="polite">ضع الورقة كاملة على سطح متباين اللون.</p><div class="camera-progress" aria-hidden="true"><i id="paper-camera-progress"></i></div><div class="camera-camera-controls"><div id="paper-camera-lenses"></div><div id="paper-camera-zoom"></div></div><label class="switch-row note camera-auto-row"><input id="paper-camera-auto" type="checkbox" checked onchange="resetCameraStability()">التقاط تلقائي عند ثبات الورقة</label><div class="actions camera-actions"><button class="btn" id="paper-camera-capture" disabled onclick="capturePaperFrame(false)">التقاط الآن</button><button class="btn light" type="button" onclick="finishDocumentBatch()">إنهاء وعرض النتائج</button></div><p class="batch-camera-context">${esc(exam.title)} · ${esc(group || 'جميع الصفوف')}</p></div>`;
  document.body.append(shell);document.body.classList.add('paper-camera-open');
  const s=PaperCamera={batchCapture:true,examSnapshot:JSON.parse(JSON.stringify(exam)),captureGroup:group,captureBatchId:uid(),capturedCount:0,generation:++PaperCameraGeneration,stream:null,timer:null,canvas:document.createElement('canvas'),previous:null,stableSince:0,busy:false,detected:false,awaitingNext:false,changeFrames:0};
  await connectPaperCamera(s);
}
// Detect the connected light page on a contrasting surface. Printed corner markers are not used.
function findDocumentEdges(c) {
  const w=c.width,h=c.height;if(w<40||h<40)return null;
  const d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data,step=2,gw=Math.floor(w/step),gh=Math.floor(h/step),gray=new Uint8Array(gw*gh),border=[];
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const k=(y*step*w+x*step)*4,v=Math.round(.299*d[k]+.587*d[k+1]+.114*d[k+2]);gray[y*gw+x]=v;if(x<3||y<3||x>=gw-3||y>=gh-3)border.push(v)}
  border.sort((a,b)=>a-b);const background=border[Math.floor(border.length*.5)];if(background>220)return null;
  const threshold=Math.max(125,Math.min(225,background+35)),seen=new Uint8Array(gray.length),queue=new Int32Array(gray.length);let best=null;
  for(let seed=0;seed<gray.length;seed++){
    if(seen[seed]||gray[seed]<threshold)continue;
    let head=0,tail=1;queue[0]=seed;seen[seed]=1;let count=0,edge=false,minSum=Infinity,maxSum=-Infinity,minDiff=Infinity,maxDiff=-Infinity,tl,tr,br,bl;
    while(head<tail){const i=queue[head++],x=i%gw,y=Math.floor(i/gw);count++;if(x<2||y<2||x>=gw-2||y>=gh-2)edge=true;
      if(x+y<minSum){minSum=x+y;tl={x:x*step,y:y*step}}if(x+y>maxSum){maxSum=x+y;br={x:x*step,y:y*step}}if(x-y>maxDiff){maxDiff=x-y;tr={x:x*step,y:y*step}}if(x-y<minDiff){minDiff=x-y;bl={x:x*step,y:y*step}}
      for(const n of [x>0?i-1:-1,x<gw-1?i+1:-1,y>0?i-gw:-1,y<gh-1?i+gw:-1])if(n>=0&&!seen[n]&&gray[n]>=threshold){seen[n]=1;queue[tail++]=n}
    }
    if(edge||count<gray.length*.23||count>gray.length*.9)continue;
    const points=[tl,tr,br,bl],area=Math.abs(points.reduce((sum,p,i)=>sum+p.x*points[(i+1)%4].y-p.y*points[(i+1)%4].x,0))/2;
    const lengths=points.map((p,i)=>Math.hypot(p.x-points[(i+1)%4].x,p.y-points[(i+1)%4].y)),ratio=(lengths[0]+lengths[2])/(lengths[1]+lengths[3]),aspect=Math.max(ratio,1/ratio);
    if(area<w*h*.25||count*step*step<area*.65||aspect<1.15||aspect>1.85||Math.min(...lengths)<Math.min(w,h)*.3||points.some(p=>p.x<w*.025||p.x>w*.975||p.y<h*.025||p.y>h*.975))continue;
    // Require straight light/dark borders, not a bright oval or a text fragment.
    const sample=(x,y)=>gray[Math.max(0,Math.min(gh-1,Math.round(y/step)))*gw+Math.max(0,Math.min(gw-1,Math.round(x/step)))];
    const straight=points.every((p,i)=>{const q=points[(i+1)%4],length=lengths[i],nx=-(q.y-p.y)/length*5,ny=(q.x-p.x)/length*5;let support=0;for(let n=1;n<=9;n++){const x=p.x+(q.x-p.x)*n/10,y=p.y+(q.y-p.y)*n/10;if((sample(x+nx,y+ny)>=threshold)!==(sample(x-nx,y-ny)>=threshold))support++}return support>=5});
    if(!straight)continue;
    if(!best||count>best.count)best={count,points};
  }
  return best?.points || null;
}
function documentFrameSignature(c) {
  const {data}=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height),out=[];
  for(let y=0;y<24;y++)for(let x=0;x<32;x++){const i=(Math.floor((y+.5)*c.height/24)*c.width+Math.floor((x+.5)*c.width/32))*4;out.push((data[i]+data[i+1]+data[i+2])/765)}return out;
}
function documentPageChanged(s, points, signature, now) {
  if(!s.awaitingNext)return true;
  if(now-(s.lastCaptureAt||0)<900)return false;
  const difference=s.lastSignature?signature.reduce((sum,v,i)=>sum+Math.abs(v-s.lastSignature[i]),0)/signature.length:0;
  s.changeFrames=(!points||difference>.1)?(s.changeFrames||0)+1:0;
  if(s.changeFrames<2)return false;
  s.awaitingNext=false;s.changeFrames=0;s.previous=null;s.stableSince=0;return true;
}
function drawDocumentOutline(s, points, ready) {
  const c=$('#paper-camera-overlay');if(!c)return;c.width=s.canvas.width;c.height=s.canvas.height;const pen=c.getContext('2d');
  const outline=points||[{x:c.width*.06,y:c.height*.06},{x:c.width*.94,y:c.height*.06},{x:c.width*.94,y:c.height*.94},{x:c.width*.06,y:c.height*.94}];
  pen.strokeStyle=ready?'#f7d66c':'#ffffffb0';pen.lineWidth=Math.max(2,c.width/240);pen.setLineDash?.(points?[]:[10,8]);pen.beginPath();outline.forEach((p,i)=>i?pen.lineTo(p.x,p.y):pen.moveTo(p.x,p.y));pen.closePath();pen.stroke();
}
const markerAnalysePaperFrame=analysePaperFrame;
analysePaperFrame=function(s){
  if(!s.batchCapture)return markerAnalysePaperFrame(s);
  if(!cameraActive(s)||s.busy)return;
  try{
    const v=$('#paper-camera-video');if(!v?.videoWidth||v.readyState<2){s.timer=setTimeout(()=>analysePaperFrame(s),220);return}
    const scale=Math.min(1,720/Math.max(v.videoWidth,v.videoHeight)),c=s.canvas;c.width=Math.round(v.videoWidth*scale);c.height=Math.round(v.videoHeight*scale);c.getContext('2d',{willReadFrequently:true}).drawImage(v,0,0,c.width,c.height);
    const points=findDocumentEdges(c),signature=documentFrameSignature(c),now=performance.now(),changed=documentPageChanged(s,points,signature,now);
    const quality=points?paperFrameQuality(c,points):{ok:false};s.documentPoints=points;s.currentSignature=signature;s.detected=!!(changed&&quality.ok);
    const progress=stablePaperFrame(s,points,now,s.detected);drawDocumentOutline(s,points,s.detected);
    cameraMessage(!changed?'حُفظت الورقة. ارفعها وضع التالية للمتابعة.':!points?'أظهر حواف الورقة كاملة فوق سطح أغمق منها.':!quality.ok?'ثبّت الهاتف، وحسّن الإضاءة حتى تتضح الكتابة.':'تم تحديد الورقة كاملة — ثبّت الهاتف للالتقاط.');
    const auto=$('#paper-camera-auto').checked;$('#paper-camera-progress').style.width=(auto?progress*100:0)+'%';
    if(auto&&progress>=1){capturePaperFrame(true);return}
  }catch{resetCameraStability();cameraMessage('تعذر تحديد حدود الورقة. أبعد الهاتف قليلًا أو التقط يدويًا.')}
  s.timer=setTimeout(()=>analysePaperFrame(s),240);
};
async function saveCapturedDocument(s, url) {
  const id=uid(),key='capture-'+id,r={id,exam:s.examSnapshot.id,snapshot:{...JSON.parse(JSON.stringify(s.examSnapshot)),paperVersion:8},student:'',name:'ورقة مصوّرة '+ar(s.capturedCount+1),number:'',group:s.captureGroup||'',captureGroup:s.captureGroup||'',captureBatchId:s.captureBatchId,captureStatus:'ungraded',pages:{0:key},answers:{},essay:{},reviewed:{},date:new Date().toISOString()};
  await filePut(key,url);db.results.push(r);
  try { if(save()===false)throw Error('تعذر حفظ بيانات الورقة. توقف التصوير؛ تحقق من مساحة الجهاز.'); } catch(error) { db.results=db.results.filter(x=>x.id!==id);throw error; }
  return r;
}
const markerCapturePaperFrame=capturePaperFrame;
capturePaperFrame=async function(automatic=false){
  const s=PaperCamera;if(!s?.batchCapture)return markerCapturePaperFrame(automatic);
  const v=$('#paper-camera-video');if(s.busy||!v?.videoWidth||v.readyState<2||(automatic&&!s.detected))return;
  s.busy=true;clearTimeout(s.timer);$('#paper-camera-capture').disabled=true;
  s.capturePromise=(async()=>{
    const c=document.createElement('canvas'),factor=Math.min(1,3200/Math.max(v.videoWidth,v.videoHeight));c.width=Math.round(v.videoWidth*factor);c.height=Math.round(v.videoHeight*factor);c.getContext('2d').drawImage(v,0,0,c.width,c.height);
    // Retain the full-resolution frame and all page margins; the outline is guidance only.
    const r=await saveCapturedDocument(s,c.toDataURL('image/jpeg',.95));s.capturedCount++;s.awaitingNext=true;s.changeFrames=0;s.lastSignature=s.currentSignature;s.lastCaptureAt=performance.now();s.previous=null;s.stableSince=0;
    if(cameraActive(s)){playPaperCameraShutter();$('#document-batch-count').textContent=ar(s.capturedCount)+' ورقة محفوظة';cameraMessage('حُفظت الورقة '+ar(s.capturedCount)+' غير مصححة. ضع الورقة التالية.')}return r;
  })();
  try{await s.capturePromise}catch(error){if(cameraActive(s)){$('#paper-camera-auto').checked=false;cameraMessage(error.message||'تعذر الحفظ. التصوير التلقائي متوقف؛ أعد المحاولة.')}}
  finally{s.busy=false;s.capturePromise=null;if(cameraActive(s)){$('#paper-camera-capture').disabled=false;s.timer=setTimeout(()=>analysePaperFrame(s),260)}}
};
async function finishDocumentBatch(){const s=PaperCamera;if(!s?.batchCapture)return closePaperCamera();if(s.capturePromise)try{await s.capturePromise}catch{}stopPaperCamera();currentResult=null;resultsExamFilter=s.examSnapshot.id;location.hash='results';results();}

function ungradedCaptureRow(r) {
  const exam=resultExam(r),pending=typeof isContinuousCameraPending==='function'&&isContinuousCameraPending(r.id);return `<tr class="ungraded-capture-row"><td>—</td><td><strong>${esc(r.name)}</strong><small class="note" style="display:block">${esc(r.captureGroup||'جميع الصفوف')} · ${new Date(r.date).toLocaleString('ar-SA')}</small></td><td>${esc(exam?.title||'الاختبار')}</td><td>—</td><td><span class="tag amber">${pending?'جارٍ التصحيح…':'غير مصححة'}</span></td><td><button class="btn gold small" type="button" ${pending?'disabled':''} onclick="correctCapturedSheet('${r.id}')">تصحيح</button> <button class="text-link" onclick="reviewResult('${r.id}')">عرض الصورة</button> <button class="delete-link" onclick="deleteResult('${r.id}')">حذف</button></td></tr>`;
}
function capturedPageNumber(r,e) { const count=paperPlan(e,8).length;if(count===1)return 0;return Number.isInteger(r.capturePage)&&r.capturePage>=0&&r.capturePage<count?r.capturePage:null; }
function setCapturedPage(id,value) { const r=db.results.find(x=>x.id===id&&x.captureStatus==='ungraded'),e=r&&(db.exams.find(x=>x.id===r.exam)||resultExam(r));if(!r||!e)return;const page=value===''?null:Number(value);if(page!==null&&(!Number.isInteger(page)||page<0||page>=paperPlan(e,8).length))return;r.capturePage=page;save(); }
async function reviewCapturedSheet(id) {
  const r=db.results.find(x=>x.id===id&&x.captureStatus==='ungraded');if(!r)return;
  const exam=db.exams.find(x=>x.id===r.exam)||resultExam(r),pages=paperPlan(exam,8);
  const pageField=pages.length>1?`<label class="field">رقم الصفحة المطبوعة<select onchange="setCapturedPage('${id}',this.value)"><option value="">اختر رقم الصفحة قبل التصحيح</option>${options(pages.map((_,p)=>[String(p),'صفحة '+ar(p+1)]),r.capturePage==null?'':String(r.capturePage))}</select></label>`:'';
  currentResult=id;$('#app').innerHTML=head('ورقة غير مصححة',`${resultExam(r)?.title||''} · ${r.captureGroup||'جميع الصفوف'}`,btn('كل النتائج','currentResult=null;results()','light')+btn('تصحيح',`correctCapturedSheet('${id}')`,'gold'))+`<section class="panel panel-pad">${pageField}<div class="callout">الصورة محفوظة ولم يبدأ تصحيحها بعد. اضغط «تصحيح» لقراءة الطالب والإجابات، ثم راجع النتيجة.</div><img id="captured-sheet-image" alt="صورة الورقة غير المصححة" style="display:block;width:100%;height:auto"></section>`;
  const url=await fileGet(r.pages[0]);if(currentResult===id&&$('#captured-sheet-image'))$('#captured-sheet-image').src=url||'';
}
async function readCapturedSheet(r) {
  const e=db.exams.find(x=>x.id===r.exam);if(!e)throw Error('استعد الاختبار الأصلي قبل تصحيح هذه الورقة');
  const printedPage=capturedPageNumber(r,e);if(printedPage===null)throw Error('اختر رقم الصفحة المطبوعة من عرض الصورة قبل التصحيح');
  const url=await fileGet(r.pages[0]);if(!url)throw Error('صورة الورقة غير متاحة على هذا الجهاز');
  currentExam=e.id;scanIndex=0;scanQueue=[{url,name:r.name,captureGroup:r.captureGroup,resultId:r.id}];scanState=null;bulkWaiting=false;bulkReviewActive=true;
  await originalOpenScan();const s=scanState;if(!s||s.exam!==r.exam)throw Error('تعذر فتح صورة الورقة');
  if(s.p!==printedPage){s.p=printedPage;await detectAndRead();renderScan();}
  if(typeof identifyScanStudent==='function')await identifyScanStudent(s);
  return {s,e};
}
async function correctCapturedSheet(id) {
  if(capturedGrading)return;if(typeof isContinuousCameraPending==='function'&&isContinuousCameraPending(id))return toast('جارٍ تصحيح الورقة في الخلفية');const r=db.results.find(x=>x.id===id&&x.captureStatus==='ungraded');if(!r)return;
  const exam=db.exams.find(x=>x.id===r.exam);
  if(exam&&capturedPageNumber(r,exam)===null){await reviewCapturedSheet(id);toast('اختر رقم الصفحة المطبوعة ثم اضغط تصحيح');return;}
  capturedGrading=true;toast('جارٍ قراءة الورقة والطالب…');
  try{
    const {s,e}=await readCapturedSheet(r);
    if(!s.corners||s.orientationReady===false){location.hash='scan';renderScan();toast('الصورة محفوظة. راجع اتجاه الورقة وحدد زوايا القالب لإكمال التصحيح.');return}
    await persistScanDraft(s,e,true);scanState=null;scanQueue=[];bulkReviewActive=false;currentResult=r.id;location.hash='results';results();toast('تم التصحيح الأولي؛ راجع الإجابات والمقالي');
  }catch(error){scanState=null;scanQueue=[];currentResult=null;results();toast(error.message||'تعذر التصحيح؛ بقيت الصورة محفوظة')}
  finally{capturedGrading=false}
}
async function correctCapturedBatch() {
  if(capturedGrading)return;const list=db.results.filter(r=>r.captureStatus==='ungraded'&&!(typeof isContinuousCameraPending==='function'&&isContinuousCameraPending(r.id))&&(resultsExamFilter==='all'||r.exam===resultsExamFilter));if(!list.length)return;
  capturedGrading=true;batchProcessing=true;let count=0,needsCorners=0;
  const button=document.querySelector('.captured-batch-toolbar button');if(button){button.disabled=true;button.textContent='جارٍ التصحيح…';}
  try{for(const r of list){try{const {s,e}=await readCapturedSheet(r);if(!s.corners||s.orientationReady===false){needsCorners++;continue}await persistScanDraft(s,e,true);count++}catch{needsCorners++}const progress=$('#captured-grading-progress');if(progress)progress.textContent=`تم تصحيح ${ar(count)} · باقٍ للمراجعة اليدوية ${ar(needsCorners)}`;}}
  finally{batchProcessing=false;capturedGrading=false;bulkReviewActive=false;scanState=null;scanQueue=[];currentResult=null;results();toast(`تم تصحيح ${ar(count)} ورقة${needsCorners?'، وبقيت '+ar(needsCorners)+' ورقة غير مصححة؛ افتحها لضبط الصورة.':''}`)}
}
const resultsBeforeCapture=results;
results=function(){resultsBeforeCapture();if(currentResult)return;const count=db.results.filter(r=>r.captureStatus==='ungraded'&&(resultsExamFilter==='all'||r.exam===resultsExamFilter)).length;if(count){document.querySelector('.results-exam-filter')?.insertAdjacentHTML('afterend',`<div class="captured-batch-toolbar"><strong>${ar(count)} ورقة غير مصححة</strong><button class="btn gold small" onclick="correctCapturedBatch()">تصحيح الأوراق المصوّرة</button><span id="captured-grading-progress" class="note" aria-live="polite"></span></div>`)}};
