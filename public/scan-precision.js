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
 // V8's number cell is x155..300, y20..49. Crop excludes the Arabic label and frame.
 if((s.version||8)!==8||!s.corners||s.orientationReady===false)return null;const c=s.canvas,w=c.width,h=c.height,source=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data,map=homography(s.corners,8);
 const top=variant===2?19:22,bottom=variant===2?50:46,x0=variant===2?155:160,x1=variant===2?299:270,scale=5,out=document.createElement('canvas');out.width=(x1-x0)*scale+40;out.height=(bottom-top)*scale+40;const ctx=out.getContext('2d'),dst=ctx.createImageData(out.width,out.height);dst.data.fill(255);
 // Interpolate the same local curve correction from the registered grade/header rings.
 const anchors=scanPlan(s,getExam()).items.flatMap(v=>v.bubbles.filter(b=>b.y<100).map(b=>{const o=s.bubbleRegistration?.offsets[v.i+':'+b.value];return o?.reliable?{...b,...o}:null})).filter(Boolean);
 for(let y=20;y<out.height-20;y++)for(let x=20;x<out.width-20;x++){const px=x0+(x-20)/scale,py=top+(y-20)/scale;let dx=0,dy=0,weight=0;for(const a of anchors){const t=1/(100+(px-a.x)**2);dx+=a.dx*t;dy+=a.dy*t;weight+=t}const p=map(px,py+((variant===0||variant===3)&&weight?dy/weight:0)),xx=Math.round(p.x),yy=Math.round(p.y);if(xx<0||yy<0||xx>=w||yy>=h)continue;const n=(yy*w+xx)*4,k=(y*out.width+x)*4;const v=.299*source[n]+.587*source[n+1]+.114*source[n+2];const value=v;dst.data[k]=dst.data[k+1]=dst.data[k+2]=value;dst.data[k+3]=255}
 // Normalize exposure before thresholding; a fixed cutoff merges faint printed digits on shaded paper.
 const hist=new Array(256).fill(0);for(let y=20;y<out.height-20;y++)for(let x=20;x<out.width-20;x++)hist[Math.round(dst.data[(y*out.width+x)*4])]++;
 const n=hist.reduce((a,b)=>a+b,0);let low=0,high=255,cumulative=0;for(let i=0;i<256;i++){cumulative+=hist[i];if(cumulative<n*.03)low=i;if(cumulative<n*.88)high=i}
 for(let y=20;y<out.height-20;y++)for(let x=20;x<out.width-20;x++){const k=(y*out.width+x)*4,v=dst.data[k],normalized=Math.max(0,Math.min(255,(v-low)*255/Math.max(30,high-low))),value=variant===1||variant===3?255*Math.pow(normalized/255,.8):normalized;dst.data[k]=dst.data[k+1]=dst.data[k+2]=value}
 // Remove printed table rules that otherwise merge with the number during OCR.
 const removeRows=[],removeCols=[];for(let y=20;y<out.height-20;y++){let ink=0;for(let x=20;x<out.width-20;x++)if(dst.data[(y*out.width+x)*4]<150)ink++;if(ink>(out.width-40)*.78)removeRows.push(y)}
 for(let x=20;x<out.width-20;x++){let ink=0;for(let y=20;y<out.height-20;y++)if(dst.data[(y*out.width+x)*4]<150)ink++;if(ink>(out.height-40)*.82)removeCols.push(x)}
 for(const y of removeRows)for(let x=20;x<out.width-20;x++){const k=(y*out.width+x)*4;dst.data[k]=dst.data[k+1]=dst.data[k+2]=255}
 for(const x of removeCols)for(let y=20;y<out.height-20;y++){const k=(y*out.width+x)*4;dst.data[k]=dst.data[k+1]=dst.data[k+2]=255}
 ctx.putImageData(dst,0,0);return out;
}
function refreshIdentityUI(s){if(scanState!==s)return;updateScanSummary();const select=$('#scan-student');if(select)select.value=s.student||''}
async function identifyScanStudent(s,force=false){
 if(!s||scanState!==s||s.student)return;const job=++IdentityJob;
 if(s.orientationReady===false){s.identityStatus='صحّح اتجاه الورقة أولًا؛ يجب أن يكون عنوان الاختبار في الأعلى.';refreshIdentityUI(s);return}
 if(!db.students.length){s.identityStatus='لا توجد قائمة طلاب على هذا الجهاز. استعد بيانات الطلاب أولًا.';refreshIdentityUI(s);return}
 const crop=studentNumberCrop(s);if(!crop){s.identityStatus='يلزم قالب V8 ورقم طالب مطبوع وزوايا صحيحة لقراءة الاسم تلقائيًا.';refreshIdentityUI(s);return}
 s.identityStatus='جارٍ قراءة رقم الطالب تلقائيًا…';refreshIdentityUI(s);
 try{await getNumberOCR();if(scanState!==s||job!==IdentityJob||s.student)return;
 const readings=[];let matched=null;
 for(const variant of [0,1,2,3]){const crop=studentNumberCrop(s,variant);if(!crop)break;const reading=numericOCRReading((await recognizeNumber(crop)).data);if(scanState!==s||job!==IdentityJob||s.student)return;
 for(const previous of readings){matched=studentFromReadings(previous,reading,db.students);if(matched)break}readings.push(reading);if(matched)break;}
 if(matched){s.student=matched.id;s.identityStatus='تم التعرف على الطالب برقم الورقة: '+matched.number;s.identityAutomatic=true}
 else{const strong=readings.filter(r=>r.confidence>=80).map(r=>printedStudentNumber(r.text)).filter(Boolean),agreed=strong.find(n=>strong.filter(x=>x===n).length>=2);
 const matches=agreed?db.students.filter(st=>normalizeStudentNumber(st.number)===agreed):[];
 s.identityStatus=agreed&&!matches.length?'الرقم المقروء '+agreed+' غير موجود في قائمة الطلاب على هذا الجهاز. استعد القائمة الصحيحة.':agreed&&matches.length>1?'رقم الطالب '+agreed+' مكرر في القائمة؛ يلزم إزالة التكرار أو اختياره يدويًا.':'لم نقرأ رقمًا مطابقًا بثقة. أعد المسح الضوئي مع وضوح الرقم أو اختره يدويًا.';s.identityAutomatic=false}
 }catch{s.identityStatus='تعذرت قراءة رقم الطالب. تحقق من الإنترنت لتحميل محرك القراءة، أو اختر الطالب يدويًا.'}
 refreshIdentityUI(s);
}
function retryStudentIdentity(){if(!scanState)return;scanState.student='';scanState.identityAutomatic=false;identifyScanStudent(scanState,true)}
