'use strict';
// Camera frames and student papers stay in the browser; no network recognition service.
let PaperCamera=null,PaperCameraGeneration=0,PaperCameraAudio=null;
function unlockPaperCameraAudio(){try{const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return null;PaperCameraAudio??=new AudioContextClass();PaperCameraAudio.resume?.().catch(()=>{});return PaperCameraAudio}catch{return null}}
function playPaperCameraShutter(){const c=PaperCameraAudio;if(!c)return;try{if(c.state==='suspended')c.resume();const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(1450,t);o.frequency.exponentialRampToValueAtTime(720,t+.075);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.11);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.115);navigator.vibrate?.(24)}catch{}}
function cameraExamReady(){const e=getExam();if(!e||!e.questions.length){toast('اختر اختبارًا يحتوي على أسئلة أولًا');return false}if(e.questions.some(q=>q.type!=='essay'&&(q.answer===null||q.answer===undefined)))toast('التقط الورقة الآن، وأكمل مفتاح الإجابة قبل اعتماد التصحيح.');return true}
async function openPaperCamera(documentScan=false){
 if(!cameraExamReady())return;
 if(!navigator.mediaDevices?.getUserMedia){toast('الكاميرا المباشرة غير متاحة هنا. استخدم زر الكاميرا العادية.');return}
 stopPaperCamera();
 unlockPaperCameraAudio();
 modal(documentScan?'مسح ضوئي للورقة':'تصوير ورقة الطالب',`<div class="camera-intro">وجّه الهاتف حتى تظهر المربعات السوداء الأربع داخل الإطارات. تلتقط الكاميرا الورقة تلقائيًا فور ثباتها ووضوحها.</div><div class="paper-camera-stage"><video id="paper-camera-video" autoplay muted playsinline></video><canvas id="paper-camera-overlay" aria-hidden="true"></canvas><div id="paper-camera-start"><span>جارٍ تشغيل الكاميرا…</span></div></div><p id="paper-camera-status" class="camera-status" role="status" aria-live="polite">اسمح للمتصفح باستخدام الكاميرا.</p><div class="camera-progress" aria-hidden="true"><i id="paper-camera-progress"></i></div><div class="camera-camera-controls"><div id="paper-camera-lenses"></div><div id="paper-camera-zoom"></div></div><label class="switch-row note camera-auto-row"><input id="paper-camera-auto" type="checkbox" checked onchange="resetCameraStability()">التقاط تلقائي عند الثبات</label><div class="actions camera-actions"><button class="btn" id="paper-camera-capture" disabled onclick="capturePaperFrame(false)">التقاط الآن</button><button class="btn light" onclick="closePaperCamera()">إلغاء</button></div><p class="note camera-footnote">يظهر اسم الطالب ودرجاته بعد الالتقاط. لن تُحفظ الإطارات الخضراء على الصورة.</p>`);
 $('#modal').classList.add('paper-camera-modal');document.body.classList.add('paper-camera-open');
 const state=PaperCamera={documentScan,generation:++PaperCameraGeneration,stream:null,timer:null,canvas:document.createElement('canvas'),previous:null,stableSince:0,busy:false,detected:false};
 await connectPaperCamera(state);
}
function cameraActive(s){return PaperCamera===s&&$('#modal')?.open}
function stopPaperCamera(){const s=PaperCamera;PaperCamera=null;PaperCameraGeneration++;if(s){clearTimeout(s.timer);s.stream?.getTracks().forEach(t=>t.stop())}const v=$('#paper-camera-video');if(v)v.srcObject=null;$('#modal')?.classList.remove('paper-camera-modal');document.body?.classList?.remove('paper-camera-open')}
function closePaperCamera(){stopPaperCamera();closeModal()}
function resetCameraStability(){if(!PaperCamera)return;PaperCamera.previous=null;PaperCamera.stableSince=0;const p=$('#paper-camera-progress');if(p)p.style.width='0%'}
function cameraMessage(message){const p=$('#paper-camera-status');if(p&&p.textContent!==message)p.textContent=message}
async function connectPaperCamera(s,deviceId){
 const connection=s.connection=(s.connection||0)+1;const active=()=>cameraActive(s)&&s.connection===connection;clearTimeout(s.timer);s.stream?.getTracks().forEach(t=>t.stop());s.stream=null;resetCameraStability();
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{...(deviceId?{deviceId:{exact:deviceId}}:{facingMode:{ideal:'environment'}}),width:{ideal:2560},height:{ideal:1920}}});
  if(!active()){stream.getTracks().forEach(t=>t.stop());return}
  s.stream=stream;const track=stream.getVideoTracks()[0],v=$('#paper-camera-video');v.muted=true;v.autoplay=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.srcObject=stream;await v.play();await waitForPaperCameraFrame(v);
  if(!active())return;
  const settings=track.getSettings?.()||{},caps=track.getCapabilities?.()||{};
  if(caps.zoom&&Number.isFinite(caps.zoom.min)){try{await track.applyConstraints({advanced:[{zoom:caps.zoom.min}]})}catch{}}
  if(!active())return;
  renderCameraZoom(track);$('#paper-camera-capture').disabled=false;$('#paper-camera-start').hidden=true;
  const devices=await navigator.mediaDevices.enumerateDevices();if(!active())return;
  const cameras=devices.filter(d=>d.kind==='videoinput');
  $('#paper-camera-lenses').innerHTML=cameras.length>1?`<label class="field camera-lens-field">العدسة / الكاميرا<select aria-label="عدسة الكاميرا" onchange="switchPaperLens(this.value)">${options(cameras.map((d,i)=>[d.deviceId,d.label||'كاميرا '+ar(i+1)]),settings.deviceId||'')}</select></label>`:'';
  s.timer=setTimeout(()=>analysePaperFrame(s),200);
 }catch(error){
  if(!active())return;s.stream?.getTracks().forEach(t=>t.stop());s.stream=null;
  const msg=error.name==='NotAllowedError'?'لم يُسمح باستخدام الكاميرا. فعّل إذن الكاميرا لهذا الموقع من إعدادات Safari.':error.name==='NotFoundError'?'لم نجد كاميرا متاحة على هذا الجهاز.':error.name==='NotReadableError'?'الكاميرا مستخدمة من تطبيق آخر. أغلق التطبيق الآخر ثم أعد المحاولة.':error.name==='OverconstrainedError'?'تعذر تشغيل إعدادات الكاميرا المطلوبة. أعد المحاولة لاستخدام الإعداد الافتراضي.':error.name==='PaperCameraFrameTimeout'?'وصلنا إلى الكاميرا، لكن Safari لم يعرض صورة المعاينة. أعد تشغيل الكاميرا.':'تعذر تشغيل الكاميرا ('+(error.name||'خطأ غير معروف')+'). تحقق من إذن Safari ثم أعد المحاولة.';
  cameraMessage(msg);$('#paper-camera-start').innerHTML=`<div class="camera-start-card"><span>${esc(msg)}</span><button class="btn" type="button" onclick="retryPaperCamera()">إعادة المحاولة</button></div>`;$('#paper-camera-capture').disabled=true;
 }
}
function waitForPaperCameraFrame(video){return new Promise((resolve,reject)=>{let done=false,timeout;const events=['loadeddata','playing','resize'];const finish=error=>{if(done)return;if(!error&&(!video.videoWidth||!video.videoHeight||video.readyState<2))return;done=true;clearTimeout(timeout);events.forEach(name=>video.removeEventListener(name,check));if(error)reject(error);else resolve()};const check=()=>finish();events.forEach(name=>video.addEventListener(name,check));timeout=setTimeout(()=>{const error=new Error('Camera preview timed out');error.name='PaperCameraFrameTimeout';finish(error)},6000);check()})}
async function retryPaperCamera(){const s=PaperCamera;if(!s)return;const start=$('#paper-camera-start');start.innerHTML='<span>جارٍ تشغيل الكاميرا…</span>';start.hidden=false;$('#paper-camera-capture').disabled=true;await connectPaperCamera(s)}
async function switchPaperLens(id){const s=PaperCamera;if(!s||s.busy)return;$('#paper-camera-capture').disabled=true;await connectPaperCamera(s,id)}
function renderCameraZoom(track){
 const host=$('#paper-camera-zoom'),cap=track.getCapabilities?.().zoom;
 if(!cap||!Number.isFinite(cap.min)||!Number.isFinite(cap.max)||cap.max<=cap.min){host.innerHTML='<p class="note">هذه الكاميرا لا تتيح التحكم بالتصغير داخل المتصفح. جرّب عدسة أوسع من القائمة إن توفرت.</p>';return}
 const current=track.getSettings?.().zoom??cap.min;
 const values=[cap.min,1,1.5,2].filter(n=>n>=cap.min&&n<=cap.max).filter((n,i,a)=>a.indexOf(n)===i).sort((a,b)=>a-b);
 host.innerHTML=`<div class="camera-zoom-buttons">${values.map(n=>`<button class="btn light small" onclick="setPaperZoom(${n})">${n===cap.min?'أوسع زاوية · ':''}${n}×</button>`).join('')}</div><label class="field camera-zoom-field">تقريب العدسة <output id="paper-camera-zoom-value">${Number(current).toFixed(1)}×</output><input aria-label="تقريب العدسة" type="range" min="${cap.min}" max="${cap.max}" step="${cap.step||.1}" value="${current}" onchange="setPaperZoom(Number(this.value))"></label>`;
}
async function setPaperZoom(value){const s=PaperCamera,track=s?.stream?.getVideoTracks()[0];if(!track)return;resetCameraStability();try{await track.applyConstraints({advanced:[{zoom:value}]});if(cameraActive(s))renderCameraZoom(track)}catch{cameraMessage('لم يدعم الهاتف هذه الدرجة من التقريب. جرّب عدسة أخرى.')}}
function paperFrameQuality(c,points){
 if(!points||points.length!==4)return{ok:false,message:'أظهر المربعات السوداء الأربع مع هامش صغير حول الورقة.'};
 const w=c.width,h=c.height,len=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),edges=points.map((p,i)=>len(p,points[(i+1)%4]));
 const area=Math.abs(points.reduce((a,p,i)=>a+p.x*points[(i+1)%4].y-p.y*points[(i+1)%4].x,0))/2;
 const ratio=(edges[0]+edges[2])/(edges[1]+edges[3]);const aspect=Math.max(ratio,1/ratio);
 if(area<w*h*.22||Math.min(...edges)<Math.min(w,h)*.28)return{ok:false,message:'قرّب الورقة قليلًا مع إبقاء المربعات الأربعة ظاهرة.'};
 if(points.some(p=>p.x<w*.018||p.x>w*.982||p.y<h*.018||p.y>h*.982))return{ok:false,message:'أبعد الهاتف قليلًا؛ إحدى العلامات قريبة من حافة الصورة.'};
 if(aspect<1.12||aspect>1.85||Math.max(edges[0]/edges[2],edges[2]/edges[0],edges[1]/edges[3],edges[3]/edges[1])>1.35)return{ok:false,message:'وازن الهاتف فوق الورقة لتقليل الميل.'};
 const data=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
 let gradients=0,count=0,bright=0;const x0=Math.ceil(Math.min(...points.map(p=>p.x))+12),x1=Math.floor(Math.max(...points.map(p=>p.x))-12),y0=Math.ceil(Math.min(...points.map(p=>p.y))+12),y1=Math.floor(Math.max(...points.map(p=>p.y))-12);
 for(let y=y0;y<y1;y+=2)for(let x=x0;x<x1;x+=2){const i=(y*w+x)*4,a=(data[i]+data[i+1]+data[i+2])/3,b=(data[i+4]+data[i+5]+data[i+6])/3;gradients+=Math.abs(a-b);bright+=a;count++}
 if(!count||bright/count<80)return{ok:false,message:'الإضاءة ضعيفة. أضئ الورقة وتجنب الظلال.'};
 if(gradients/count<2.1)return{ok:false,message:'انتظر تركيز الكاميرا وثبّت الهاتف حتى تتضح الكتابة.'};
 return{ok:true,message:'تم تحديد العلامات الأربع — ثبّت الهاتف للالتقاط.'};
}
function stablePaperFrame(s,points,now,ready){
 if(!ready){s.previous=null;s.stableSince=0;return 0}
 const scale=Math.max(s.canvas.width,s.canvas.height),movement=s.previous?Math.max(...points.map((p,i)=>Math.hypot(p.x-s.previous[i].x,p.y-s.previous[i].y)))/scale:Infinity;
 if(movement>.008||!s.stableSince)s.stableSince=now;
 s.previous=points.map(p=>({...p}));return Math.min(1,(now-s.stableSince)/720);
}
function drawCameraGuides(s,points,ready){
 const c=$('#paper-camera-overlay');if(!c||!s.canvas)return;c.width=s.canvas.width;c.height=s.canvas.height;const ctx=c.getContext('2d'),w=c.width,h=c.height;
 const guides=points||[{x:w*.08,y:h*.08},{x:w*.92,y:h*.08},{x:w*.92,y:h*.92},{x:w*.08,y:h*.92}];
 ctx.strokeStyle=ready?'#21f36a':points?'#b6f566':'#21f36a';ctx.lineWidth=Math.max(3,w/180);ctx.lineCap='round';
 guides.forEach((p,i)=>{const a=Math.max(12,w*.018),sx=i===0||i===3?1:-1,sy=i<2?1:-1;ctx.strokeRect(p.x-a*.58,p.y-a*.58,a*1.16,a*1.16);ctx.beginPath();ctx.moveTo(p.x+sx*a*1.7,p.y);ctx.lineTo(p.x,p.y);ctx.lineTo(p.x,p.y+sy*a*1.7);ctx.stroke()});
 if(points&&ready){ctx.strokeStyle='#31df7b99';ctx.lineWidth=Math.max(1,w/650);ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke()}
}
function analysePaperFrame(s){
 if(!cameraActive(s)||s.busy)return;
 try{const v=$('#paper-camera-video');if(!v?.videoWidth||v.readyState<2){s.timer=setTimeout(()=>analysePaperFrame(s),200);return}
 const k=Math.min(1,720/Math.max(v.videoWidth,v.videoHeight)),c=s.canvas;c.width=Math.round(v.videoWidth*k);c.height=Math.round(v.videoHeight*k);c.getContext('2d',{willReadFrequently:true}).drawImage(v,0,0,c.width,c.height);
 const points=findMarkers(c),quality=paperFrameQuality(c,points);s.detected=quality.ok;
 const progress=stablePaperFrame(s,points,performance.now(),quality.ok);drawCameraGuides(s,points,quality.ok);cameraMessage(quality.message);const auto=$('#paper-camera-auto').checked;$('#paper-camera-progress').style.width=(auto?progress*100:0)+'%';
 if(auto&&progress>=1){capturePaperFrame(true);return}
 }catch{resetCameraStability();cameraMessage('تعذر فحص هذه اللقطة. يمكنك الالتقاط يدويًا ومراجعة الزوايا.')}
 s.timer=setTimeout(()=>analysePaperFrame(s),240);
}
async function capturePaperFrame(automatic=false){
 const s=PaperCamera,v=$('#paper-camera-video');if(!s||s.busy||!v?.videoWidth||v.readyState<2)return;if(automatic&&!s.detected)return;
 s.busy=true;clearTimeout(s.timer);$('#paper-camera-capture').disabled=true;
 try{const c=document.createElement('canvas'),k=Math.min(1,2400/Math.max(v.videoWidth,v.videoHeight));c.width=Math.round(v.videoWidth*k);c.height=Math.round(v.videoHeight*k);c.getContext('2d').drawImage(v,0,0,c.width,c.height);playPaperCameraShutter();const url=c.toDataURL('image/jpeg',.95);closePaperCamera();scanQueue=[{name:s.documentScan?'مسح ضوئي للهاتف':'تصوير الهاتف',url,documentScan:s.documentScan,cameraScan:true}];scanIndex=0;await openScan();toast('تم التصوير. تجري قراءة رقم الطالب والإجابات تلقائيًا.')}catch{s.busy=false;if(cameraActive(s)){$('#paper-camera-capture').disabled=false;s.timer=setTimeout(()=>analysePaperFrame(s),240)}toast('تعذر التقاط الصورة. أعد المحاولة.')}
}
// Compare printed bubble rings across all rotations, rather than inferring orientation from aspect alone.
function paperOrientation(c,exam,version=8){
 const corners=findMarkers(c);if(!corners)return{turn:0,confident:false};
 const bubbles=scanPlan({version,p:0},exam).items.flatMap(v=>v.bubbles),g=paperGeometry(version);
 const sample=bubbles.filter((_,i)=>i%Math.max(1,Math.floor(bubbles.length/40))===0).slice(0,45),w=c.width,h=c.height,d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
 const pixel=p=>{const x=Math.round(p.x),y=Math.round(p.y);if(x<0||y<0||x>=w||y>=h)return 255;const i=(y*w+x)*4;return(d[i]+d[i+1]+d[i+2])/3};
 const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),ratio=(length(corners[0],corners[1])+length(corners[3],corners[2]))/(length(corners[0],corners[3])+length(corners[1],corners[2]));
 const expected=(g.width-64)/(g.height-64),parity=(ratio>1)===(expected>1)?0:1;
 const scores=Array.from({length:2},(_,k)=>{const turn=parity+k*2,map=homography(corners.map((_,i)=>corners[(i+turn)%4]),version);let score=0;
 for(const b of sample){let ring=0,white=0;for(let j=0;j<16;j++){const a=j*Math.PI/8;ring+=Math.min(...[.9,1,1.1].map(r=>pixel(map(b.x+Math.cos(a)*b.r*r,b.y+Math.sin(a)*b.r*r))));white+=pixel(map(b.x+Math.cos(a)*b.r*1.55,b.y+Math.sin(a)*b.r*1.55))}score+=Math.max(0,(white-ring)/(16*255))}
 let header=0,n=0;for(let y=18;y<=58;y+=2)for(let x=100;x<g.width-100;x+=4){const ink=pixel(map(x,y)),background=Math.max(pixel(map(x+4,y)),pixel(map(x-4,y)),pixel(map(x,y+4)),pixel(map(x,y-4)));header+=background>130?Math.max(0,(background-ink)/background):0;n++}
 return{turn,score:score/Math.max(1,sample.length),header:header/n};}).sort((a,b)=>(b.score+b.header*.8)-(a.score+a.header*.8));
 const ringConfident=scores[0].score>.1&&scores[0].score-scores[1].score>.045;
 const headerBest=[...scores].sort((a,b)=>b.header-a.header),headerConfident=version>=3&&headerBest[0].header>.025&&headerBest[0].header-headerBest[1].header>.015;
 const best=ringConfident?scores[0]:headerConfident?headerBest[0]:scores[0];
 return{turn:best.turn,confident:ringConfident||headerConfident,scores};
}
function orientScanCanvas(c,exam,version=8){
 const orientation=paperOrientation(c,exam,version);c.scanOrientation=orientation;if(!orientation.confident||!orientation.turn)return c;
 const turns=(4-orientation.turn)%4,out=document.createElement('canvas');out.width=turns%2?c.height:c.width;out.height=turns%2?c.width:c.height;const ctx=out.getContext('2d');ctx.translate(out.width/2,out.height/2);ctx.rotate(turns*Math.PI/2);ctx.drawImage(c,-c.width/2,-c.height/2);out.scanOrientation=orientation;return out;
}
function rectifyDocumentCanvas(c,version=8){
 const corners=findMarkers(c);if(!corners)throw Error('أظهر المربعات الأربع لقص الورقة تلقائيًا');
 const g=paperGeometry(version),out=document.createElement('canvas'),scale=1.6;out.width=Math.round(g.width*scale);out.height=Math.round(g.height*scale);
 const source=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data,ctx=out.getContext('2d'),dst=ctx.createImageData(out.width,out.height),map=homography(corners,version);
 // Bilinear resampling preserves faint marks; no destructive black/white threshold.
 const gray=(a,b)=>{const n=(b*c.width+a)*4;return .299*source[n]+.587*source[n+1]+.114*source[n+2]};
 for(let y=0;y<out.height;y++)for(let x=0;x<out.width;x++){const p=map(x/scale,y/scale),xx=Math.floor(p.x),yy=Math.floor(p.y),fx=p.x-xx,fy=p.y-yy,k=(y*out.width+x)*4;let value=255;
 if(xx>=0&&yy>=0&&xx<c.width-1&&yy<c.height-1){value=gray(xx,yy)*(1-fx)*(1-fy)+gray(xx+1,yy)*fx*(1-fy)+gray(xx,yy+1)*(1-fx)*fy+gray(xx+1,yy+1)*fx*fy}
 dst.data[k]=dst.data[k+1]=dst.data[k+2]=value;dst.data[k+3]=255;}
 const size=48,cols=Math.ceil(out.width/size),rows=Math.ceil(out.height/size),background=[];
 for(let by=0;by<rows;by++)for(let bx=0;bx<cols;bx++){const values=[];for(let y=by*size;y<Math.min((by+1)*size,out.height);y+=4)for(let x=bx*size;x<Math.min((bx+1)*size,out.width);x+=4)values.push(dst.data[(y*out.width+x)*4]);values.sort((a,b)=>a-b);background.push(values[Math.floor(values.length*.9)]||255)}
 for(let y=0;y<out.height;y++)for(let x=0;x<out.width;x++){const k=(y*out.width+x)*4,bg=background[Math.floor(y/size)*cols+Math.floor(x/size)],v=Math.min(255,dst.data[k]*250/Math.max(90,bg));dst.data[k]=dst.data[k+1]=dst.data[k+2]=v}
 ctx.putImageData(dst,0,0);out.scanOrientation=c.scanOrientation;return out;
}
function updateScanSummary(){const host=$('#scan-summary'),s=scanState;if(!host||!s)return;const e=db.exams.find(e=>e.id===s.exam),student=db.students.find(st=>st.id===s.student),plan=scanPlan(s,e);const pageMax=plan.items.reduce((a,v)=>a+Number(v.q.points||0),0);const provisional=score({snapshot:{...e,paperVersion:s.version||8},answers:s.answers,essay:s.essay});const unresolved=plan.items.filter(v=>(v.q.type==='essay'?s.essay[v.i]:s.answers[v.i])==null).length;
 host.innerHTML=`<div class="scan-student-card"><div><small>الطالب</small><strong>${esc(student?.name||(s.identityStatus?.startsWith('جارٍ')?'جارٍ التعرف على الطالب…':'اختر الطالب من القائمة أدناه'))}</strong><span>${student?'رقم الطالب: '+esc(student.number):'اربط الورقة بالطالب قبل حفظ النتيجة'}</span></div><div class="scan-page-score"><small>درجة الصفحة الأولية</small><b>${ar(provisional)} <span>/ ${ar(pageMax)}</span></b></div></div><p class="note scan-identity-status">${esc(s.identityStatus||'')} ${typeof identifyScanStudent==='function'?'<button class="text-link" onclick="retryStudentIdentity()">إعادة قراءة رقم الطالب</button>':''}</p><p class="note">${unresolved?'يوجد '+ar(unresolved)+' سؤال أو درجة غير مرصودة. ':''}الدرجة تتحدث عند تعديل الإجابات، وتعتمد بعد مراجعتك وحفظها.</p>`}
// Closing via X, Escape, navigation or a hidden tab releases the camera hardware.
if(typeof document.addEventListener==='function'){
 document.querySelector('#modal')?.addEventListener('close',stopPaperCamera);
 document.querySelector('#modal')?.addEventListener('cancel',stopPaperCamera);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&PaperCamera)closePaperCamera()});
 window.addEventListener('pagehide',stopPaperCamera);
}
