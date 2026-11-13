'use strict';
// Local registration follows printed rings on gently curved pages. OMR and overlay share these offsets.

function bubblePointMap(s,map,i,b){const offset=s.bubbleRegistration?.offsets[i+':'+b.value];return(x,y)=>map(x+(offset?.dx||0),y+(offset?.dy||0))}
function identityStudentsForScan(s){return db.students.filter(st=>!s.captureGroup||st.group===s.captureGroup)}
function studentIdentityActive(s){return s?.backgroundIdentity===true||scanState===s}
function scanIdentityNotice(s){return s.identityStatus||'تجري قراءة رقم الطالب من الورقة…'}
let NumberOCR=null,NumberOCRLoading=null,IdentityJob=0,NumberOCRQueue=Promise.resolve();
function recognizeNumber(image){const task=NumberOCRQueue.then(async()=>{const worker=await getNumberOCR();return worker.recognize(image,{}, {text:true,blocks:true})});NumberOCRQueue=task.catch(()=>{});return task}
function normalizeStudentNumber(value){return String(value??'').replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[\s\u200e\u200f-]/g,'')}
function printedStudentNumber(text){const clean=normalizeStudentNumber(String(text||'').trim());if(/^[0-9]+$/.test(clean))return clean;const tokens=String(text||'').match(/[0-9٠-٩۰-۹]+/g)||[],numbers=[...new Set(tokens.map(normalizeStudentNumber))];return numbers.length===1?numbers[0]:null}
function exactStudentMatch(text,confidence,students){if(confidence<70)return null;const number=printedStudentNumber(text);if(!number)return null;const matches=students.filter(s=>normalizeStudentNumber(s.number)===number);return matches.length===1?matches[0]:null}
function studentFromReadings(first,second,students){const a=exactStudentMatch(first.text,first.confidence,students),b=exactStudentMatch(second.text,second.confidence,students);return a&&b&&a.id===b.id&&(first.confidence+second.confidence)/2>=80?a:null}
function numericOCRReading(data){const words=(data.blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>(p.lines||[]).flatMap(l=>l.words||[]))),numeric=words.filter(w=>/^[0-9٠-٩۰-۹]+$/.test(String(w.text||'').trim())&&w.confidence>=65);if(numeric.length===1)return{text:numeric[0].text,confidence:numeric[0].confidence};return{text:data.text,confidence:data.confidence}}
async function getNumberOCR(){
 if(NumberOCR)return NumberOCR;if(NumberOCRLoading)return NumberOCRLoading;
 NumberOCRLoading=(async()=>{if(!window.Tesseract)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';script.onload=resolve;script.onerror=()=>reject(Error('تعذر تحميل محرك قراءة الرقم'));document.head.appendChild(script)});
 const worker=await Tesseract.createWorker('eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',langPath:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int',workerBlobURL:true});
 await worker.setParameters({tessedit_pageseg_mode:'7',preserve_interword_spaces:'1',user_defined_dpi:'300'});NumberOCR=worker;return worker;
 })().catch(error=>{NumberOCRLoading=null;throw error});return NumberOCRLoading;
}
function studentNumberCrop(s,variant=0){
 // V8 number is at the left of its RTL cell. Keep the Arabic label out of OCR.
 // Alternate exposures and a wider crop support printed/scanned and shifted headers.
 const version=s.version||8,portrait=version===9;
 if((version!==8&&!portrait)||!s.corners||s.orientationReady===false)return null;const c=s.canvas,w=c.width,h=c.height,source=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data,map=homography(s.corners,version);
 const wide=variant>=2,top=portrait?49:wide?16:22,bottom=portrait?73:wide?53:46,x0=portrait?56:wide?156:160,x1=portrait?157:wide?248:242,scale=5,out=document.createElement('canvas');out.width=(x1-x0)*scale+40;out.height=(bottom-top)*scale+40;const ctx=out.getContext('2d'),dst=ctx.createImageData(out.width,out.height);dst.data.fill(255);
 // Interpolate the same local curve correction from the registered grade/header rings.
 const anchors=scanPlan(s,s.identityExam||db.exams.find(e=>e.id===s.exam)||getExam()).items.flatMap(v=>v.bubbles.filter(b=>b.y<100).map(b=>{const o=s.bubbleRegistration?.offsets[v.i+':'+b.value];return o?.reliable?{...b,...o}:null})).filter(Boolean);
 for(let y=20;y<out.height-20;y++)for(let x=20;x<out.width-20;x++){const px=x0+(x-20)/scale,py=top+(y-20)/scale;let dx=0,dy=0,weight=0;for(const a of anchors){const t=1/(100+(px-a.x)**2);dx+=a.dx*t;dy+=a.dy*t;weight+=t}const p=map(px+((variant===0||variant===1)&&weight?dx/weight:0),py+((variant===0||variant===1)&&weight?dy/weight:0)),xx=Math.round(p.x),yy=Math.round(p.y);if(xx<0||yy<0||xx>=w||yy>=h)continue;const n=(yy*w+xx)*4,k=(y*out.width+x)*4;const v=.299*source[n]+.587*source[n+1]+.114*source[n+2];const value=v;dst.data[k]=dst.data[k+1]=dst.data[k+2]=value;dst.data[k+3]=255}
 // Normalize exposure before thresholding; a fixed cutoff merges faint printed digits on shaded paper.
 const hist=new Array(256).fill(0);for(let y=20;y<out.height-20;y++)for(let x=20;x<out.width-20;x++)hist[Math.round(dst.data[(y*out.width+x)*4])]++;
 const n=hist.reduce((a,b)=>a+b,0);let low=0,high=255,cumulative=0;for(let i=0;i<256;i++){cumulative+=hist[i];if(cumulative<n*.03)low=i;if(cumulative<n*.88)high=i}
 for(let y=20;y<out.height-20;y++)for(let x=20;x<out.width-20;x++){const k=(y*out.width+x)*4,v=dst.data[k],normalized=Math.max(0,Math.min(255,(v-low)*255/Math.max(30,high-low))),value=variant===1||variant===3?(normalized<155?0:255):normalized;dst.data[k]=dst.data[k+1]=dst.data[k+2]=value}
 // Remove printed table rules that otherwise merge with the number during OCR.
 const removeRows=[],removeCols=[];for(let y=20;y<out.height-20;y++){let ink=0;for(let x=20;x<out.width-20;x++)if(dst.data[(y*out.width+x)*4]<150)ink++;if(ink>(out.width-40)*.78)removeRows.push(y)}
 for(let x=20;x<out.width-20;x++){let ink=0;for(let y=20;y<out.height-20;y++)if(dst.data[(y*out.width+x)*4]<150)ink++;if(ink>(out.height-40)*.82)removeCols.push(x)}
 for(const y of removeRows)for(let x=20;x<out.width-20;x++){const k=(y*out.width+x)*4;dst.data[k]=dst.data[k+1]=dst.data[k+2]=255}
 for(const x of removeCols)for(let y=20;y<out.height-20;y++){const k=(y*out.width+x)*4;dst.data[k]=dst.data[k+1]=dst.data[k+2]=255}
 ctx.putImageData(dst,0,0);return out;
}
function refreshIdentityUI(s){if(s.backgroundIdentity||scanState!==s)return;const r=db.results.find(x=>x.id===s.savedResultId),st=db.students.find(x=>x.id===s.student);if(r&&!r.student&&st){r.student=st.id;r.name=st.name;r.number=st.number;r.group=st.group;r.updated=new Date().toISOString();save()}updateScanSummary();const select=$('#scan-student');if(select)select.value=s.student||''}
async function readScanStudent(s){
 if(!s||!studentIdentityActive(s)||s.student)return;const job=s.identityJob=(s.identityJob||0)+1;
 if(s.orientationReady===false){s.identityStatus='صحّح اتجاه الورقة أولًا؛ يجب أن يكون عنوان الاختبار في الأعلى.';refreshIdentityUI(s);return}
 const students=identityStudentsForScan(s);
 if(!students.length){s.identityStatus='لا توجد قائمة طلاب على هذا الجهاز. استعد بيانات الطلاب أولًا.';refreshIdentityUI(s);return}
 const crop=studentNumberCrop(s);if(!crop){s.identityStatus='يلزم قالب V8 أو V9 ورقم طالب مطبوع وزوايا صحيحة لقراءة الاسم تلقائيًا.';refreshIdentityUI(s);return}
 s.identityStatus='جارٍ قراءة رقم الطالب تلقائيًا…';refreshIdentityUI(s);
 try{await getNumberOCR();if(!studentIdentityActive(s)||job!==s.identityJob||s.student)return;
 const readings=[];let matched=null;
 s.identityReadings=[];
 for(const variant of [0,1,2,3]){const crop=studentNumberCrop(s,variant);if(!crop)break;const reading=numericOCRReading((await recognizeNumber(crop)).data);if(!studentIdentityActive(s)||job!==s.identityJob||s.student)return;
 for(const previous of readings){matched=studentFromReadings(previous,reading,students);if(matched)break}readings.push(reading);s.identityReadings=readings;if(matched)break;}
 if(matched){s.student=matched.id;s.identityStatus='تم التعرف على الطالب برقم الورقة: '+matched.number;s.identityAutomatic=true}
 else{const strong=readings.filter(r=>r.confidence>=80).map(r=>printedStudentNumber(r.text)).filter(Boolean),agreed=strong.find(n=>strong.filter(x=>x===n).length>=2);
 const matches=agreed?students.filter(st=>normalizeStudentNumber(st.number)===agreed):[];
 s.identityStatus=agreed&&!matches.length?'الرقم المقروء '+agreed+' غير موجود في قائمة الطلاب على هذا الجهاز. استعد القائمة الصحيحة.':agreed&&matches.length>1?'رقم الطالب '+agreed+' مكرر في القائمة؛ يلزم إزالة التكرار أو اختياره يدويًا.':'لم نقرأ رقمًا مطابقًا بثقة. أعد المسح الضوئي مع وضوح الرقم أو اختره يدويًا.';s.identityAutomatic=false}
 }catch{s.identityStatus='تعذرت قراءة رقم الطالب. تحقق من الإنترنت لتحميل محرك القراءة، أو اختر الطالب يدويًا.'}
 refreshIdentityUI(s);
}
function identifyScanStudent(s,force=false){
 if(!s||!studentIdentityActive(s)||s.student)return Promise.resolve();
 if(s.identityPromise)return s.identityPromise;
 const task=readScanStudent(s);s.identityPromise=task;
 return task.finally(()=>{if(s.identityPromise===task)s.identityPromise=null});
}
function retryStudentIdentity(){if(!scanState)return;scanState.student='';scanState.identityAutomatic=false;identifyScanStudent(scanState,true)}
