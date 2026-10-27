'use strict';
// Local registration follows printed rings on gently curved pages. OMR and overlay share these offsets.
function registerBubbleRings(canvas,map,plan){
 const w=canvas.width,h=canvas.height,data=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
 const gray=(x,y)=>{const p=map(x,y),a=Math.round(p.x),b=Math.round(p.y);if(a<0||b<0||a>=w||b>=h)return 255;const n=(b*w+a)*4;return .299*data[n]+.587*data[n+1]+.114*data[n+2]};
 const ring=(b,dx,dy)=>{let total=0,support=0;for(let j=0;j<16;j++){const a=j*Math.PI/8,c=Math.cos(a)*b.r,s=Math.sin(a)*b.r;const x=b.x+dx,y=b.y+dy,ink=Math.min(gray(x+c*.86,y+s*.86),gray(x+c,y+s),gray(x+c*1.12,y+s*1.12));const white=gray(b.x+dx+c*1.55,b.y+dy+s*1.55);const contrast=Math.max(0,(white-ink)/Math.max(100,white));total+=contrast;if(contrast>.16)support++}return support>=10?total/16:0};
 const offsets={};let reliable=0,count=0;
 for(const v of plan.items){const bb=v.bubbles;if(!bb.length)continue;const r=bb[0].r,probe=bb.length>3?[bb[0],bb[Math.floor(bb.length/2)],bb[bb.length-1]]:bb;const merit=(dx,dy)=>probe.reduce((a,b)=>a+ring(b,dx,dy),0)/probe.length-.014*Math.hypot(dx,dy)/r;
 let best={dx:0,dy:0,score:merit(0,0)};
 for(let dy=-Math.ceil(r*1.7);dy<=r*1.7;dy+=3)for(let dx=-Math.ceil(r*1.15);dx<=r*1.15;dx+=3){const score=merit(dx,dy);if(score>best.score+.002)best={dx,dy,score}}
 for(const b of bb){let local={dx:best.dx,dy:best.dy,score:ring(b,best.dx,best.dy)};
 for(let dy=best.dy-2;dy<=best.dy+2;dy++)for(let dx=best.dx-2;dx<=best.dx+2;dx++){const score=ring(b,dx,dy)-.006*Math.hypot(dx-best.dx,dy-best.dy);if(score>local.score+.012)local={dx,dy,score}}
 const good=local.score>.17;offsets[v.i+':'+b.value]={dx:good?local.dx:0,dy:good?local.dy:0,reliable:good,score:local.score};reliable+=good;count++;
 }
 }
 return{offsets,reliable,count};
}
function bubblePointMap(s,map,i,b){const offset=s.bubbleRegistration?.offsets[i+':'+b.value];return(x,y)=>map(x+(offset?.dx||0),y+(offset?.dy||0))}
function scanIdentityNotice(s){return s.identityStatus||'تجري قراءة رقم الطالب من الورقة…'}
let NumberOCR=null,NumberOCRLoading=null,IdentityJob=0,NumberOCRQueue=Promise.resolve();
function recognizeNumber(image){const task=NumberOCRQueue.then(async()=>{const worker=await getNumberOCR();return worker.recognize(image)});NumberOCRQueue=task.catch(()=>{});return task}
function normalizeStudentNumber(value){return String(value??'').replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[\s\u200e\u200f-]/g,'')}
function exactStudentMatch(text,confidence,students){if(confidence<70)return null;const tokens=String(text||'').match(/[0-9٠-٩۰-۹]+/g)||[];const numbers=[...new Set(tokens.map(normalizeStudentNumber))];if(numbers.length!==1||numbers[0].length<2)return null;const matches=students.filter(s=>normalizeStudentNumber(s.number)===numbers[0]);return matches.length===1?matches[0]:null}
function studentFromReadings(first,second,students){const a=exactStudentMatch(first.text,first.confidence,students),b=exactStudentMatch(second.text,second.confidence,students);return a&&b&&a.id===b.id&&(first.confidence+second.confidence)/2>=80?a:null}
async function getNumberOCR(){
 if(NumberOCR)return NumberOCR;if(NumberOCRLoading)return NumberOCRLoading;
 NumberOCRLoading=(async()=>{if(!window.Tesseract)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';script.onload=resolve;script.onerror=()=>reject(Error('تعذر تحميل محرك قراءة الرقم'));document.head.appendChild(script)});
 const worker=await Tesseract.createWorker('eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',langPath:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int',workerBlobURL:true});
 await worker.setParameters({tessedit_pageseg_mode:'7',preserve_interword_spaces:'1',user_defined_dpi:'300'});NumberOCR=worker;return worker;
 })().catch(error=>{NumberOCRLoading=null;throw error});return NumberOCRLoading;
}
function studentNumberCrop(s,variant=0){
 // V8's number cell is x155..300, y20..49. Crop excludes the Arabic label and frame.
 if((s.version||8)!==8||!s.corners)return null;const c=s.canvas,w=c.width,h=c.height,source=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data,map=homography(s.corners,8);
 const top=22,bottom=46,x0=153,x1=233,scale=5,out=document.createElement('canvas');out.width=(x1-x0)*scale+40;out.height=(bottom-top)*scale+40;const ctx=out.getContext('2d'),dst=ctx.createImageData(out.width,out.height);dst.data.fill(255);
 // Interpolate the same local curve correction from the registered grade/header rings.
 const anchors=scanPlan(s,getExam()).items.flatMap(v=>v.bubbles.filter(b=>b.y<100).map(b=>{const o=s.bubbleRegistration?.offsets[v.i+':'+b.value];return o?.reliable?{...b,...o}:null})).filter(Boolean);
 for(let y=20;y<out.height-20;y++)for(let x=20;x<out.width-20;x++){const px=x0+(x-20)/scale,py=top+(y-20)/scale;let dx=0,dy=0,weight=0;for(const a of anchors){const t=1/(100+(px-a.x)**2);dx+=a.dx*t;dy+=a.dy*t;weight+=t}const p=map(px,py+(weight?dy/weight:0)),xx=Math.round(p.x),yy=Math.round(p.y);if(xx<0||yy<0||xx>=w||yy>=h)continue;const n=(yy*w+xx)*4,k=(y*out.width+x)*4;const v=.299*source[n]+.587*source[n+1]+.114*source[n+2];const value=v;dst.data[k]=dst.data[k+1]=dst.data[k+2]=value;dst.data[k+3]=255}
 // Normalize exposure before thresholding; a fixed cutoff merges faint printed digits on shaded paper.
 const hist=new Array(256).fill(0);for(let y=20;y<out.height-20;y++)for(let x=20;x<out.width-20;x++)hist[Math.round(dst.data[(y*out.width+x)*4])]++;
 const n=hist.reduce((a,b)=>a+b,0);let low=0,high=255,cumulative=0;for(let i=0;i<256;i++){cumulative+=hist[i];if(cumulative<n*.03)low=i;if(cumulative<n*.88)high=i}
 for(let y=20;y<out.height-20;y++)for(let x=20;x<out.width-20;x++){const k=(y*out.width+x)*4,v=dst.data[k],normalized=Math.max(0,Math.min(255,(v-low)*255/Math.max(30,high-low))),value=variant?255*Math.pow(normalized/255,.8):normalized;dst.data[k]=dst.data[k+1]=dst.data[k+2]=value}
 ctx.putImageData(dst,0,0);return out;
}
function refreshIdentityUI(s){if(scanState!==s)return;updateScanSummary();const select=$('#scan-student');if(select)select.value=s.student||''}
async function identifyScanStudent(s,force=false){
 if(!s||scanState!==s||s.student)return;const job=++IdentityJob;
 if(!db.students.length){s.identityStatus='لا توجد قائمة طلاب على هذا الجهاز. استعد بيانات الطلاب أولًا.';refreshIdentityUI(s);return}
 const crop=studentNumberCrop(s);if(!crop){s.identityStatus='يلزم قالب V8 ورقم طالب مطبوع وزوايا صحيحة لقراءة الاسم تلقائيًا.';refreshIdentityUI(s);return}
 s.identityStatus='جارٍ قراءة رقم الطالب تلقائيًا…';refreshIdentityUI(s);
 try{const worker=await getNumberOCR();if(scanState!==s||job!==IdentityJob||s.student)return;
 const first=(await recognizeNumber(crop)).data;if(scanState!==s||job!==IdentityJob||s.student)return;
 
 const second=(await recognizeNumber(studentNumberCrop(s,1))).data;if(scanState!==s||job!==IdentityJob||s.student)return;
 const matched=studentFromReadings(first,second,db.students);
 if(matched){s.student=matched.id;s.identityStatus='تم التعرف على الطالب برقم الورقة: '+matched.number;s.identityAutomatic=true}
 else{s.identityStatus='لم نقرأ رقمًا مطابقًا بثقة. تأكد من وضوح رقم الطالب أو اختره يدويًا.';s.identityAutomatic=false}
 }catch{s.identityStatus='تعذرت قراءة رقم الطالب. تحقق من الإنترنت لتحميل محرك القراءة، أو اختر الطالب يدويًا.'}
 refreshIdentityUI(s);
}
function retryStudentIdentity(){if(!scanState)return;scanState.student='';scanState.identityAutomatic=false;identifyScanStudent(scanState,true)}
