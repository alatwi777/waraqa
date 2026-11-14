'use strict';
const QuestionFiles=(()=>{
 const clean=s=>String(s??'').normalize('NFKC').replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'').replace(/[٠-٩۰-۹]/g,c=>String(c.charCodeAt(0)>=1776?c.charCodeAt(0)-1776:c.charCodeAt(0)-1632)).replace(/ـ/g,'').trim();
 const plain=s=>clean(s).replace(/[أإآ]/g,'ا').replace(/[\u064b-\u065f]/g,'');
 function linesFromItems(items){const rows=[];for(const item of items){if(!item.str?.trim()||!item.transform)continue;const y=item.transform[5];let row=rows.find(r=>Math.abs(r.y-y)<2.5);if(!row){row={y,items:[]};rows.push(row);}row.items.push(item);}return rows.sort((a,b)=>b.y-a.y).map(r=>clean(r.items.sort((a,b)=>b.transform[4]-a.transform[4]).map(i=>i.str).join(' '))).filter(Boolean);}
 // PDF text can join the answer label to option D, or split its Arabic words.
 const answerLabel=/(?:(?:[اإأآ][اإأآل]*جاب[ةه])\s+)?الصحيح[ةه]\s*[:：]/;
 const danglingAnswer=/\s*[اإأآ][اإأآل]*جاب[ةه]\s*$/;
 function answerParts(value){const match=value.match(answerLabel);if(!match)return null;return {before:value.slice(0,match.index).replace(danglingAnswer,'').trim(),after:value.slice(match.index+match[0].length)};}
 function answerMetadata(text){const normalized=plain(text),key=normalized.split(/الدرج[ةه]/)[0].replace(/^[|｜:：.،\s]+|[|｜:：.،\s]+$/g,'').trim(),grade=normalized.match(/الدرج[ةه]\s*[:：]\s*(\d+(?:[.,]\d+)?)/);return {key,points:grade?Number(grade[1].replace(',','.')):null};}
 function normalizeAnswerLines(text){return String(text).split(/\r?\n/).flatMap(line=>{const value=clean(line).replace(/(الصحيح[ةه])\s+(?=[أابجدصخ])/g,'$1: '),parts=answerParts(value);if(!parts)return [line];const meta=answerMetadata(parts.after),key=({'ا':'أ','خطا':'خطأ'}[meta.key]||meta.key);return [...(parts.before?[parts.before]:[]),'الإجابة الصحيحة: '+key+':'+(meta.points!==null?' الدرجة: '+meta.points:'')];}).join('\n');}
 function parse(text,choiceCount=4){const blocks=[];let block=null;
 const append=line=>{if(!line)return;const option=line.match(/^([أابجد])\s*[:：)）.-]\s*(.*)$/);if(option&&block.type==='mcq'){const n=['ا','ب','ج','د'].indexOf(plain(option[1]));if(block.options[n])block.issues.push('خيار مكرر '+option[1]);block.options[n]=option[2];block.field=n;}else if(block.field==='text')block.text+=(block.text?' ':'')+line;else if(typeof block.field==='number')block.options[block.field]+=' '+line;};
 for(const original of String(text).split(/\r?\n/)){let line=clean(original);if(!line)continue;const start=line.match(/^(اختياري|صح\s*و\s*خط[أا]|مقالي)\s*(\d+)\s*[:：.)-]\s*(.*)$/);if(start){block={type:start[1]==='اختياري'?'mcq':start[1]==='مقالي'?'essay':'tf',number:Number(start[2]),text:'',options:['','','',''],answer:null,points:1,field:'text',issues:[]};blocks.push(block);line=start[3];}if(!block)continue;
 const normalized=plain(line);if(/^(اختيار من متعدد|صح وخطا\s*[-–]|قالب اعداد|اجب عن الاسئلة التالية)/.test(normalized)||/^(صح\s*[☐□].*خطا|[.]{5,})/.test(normalized))continue;
 const parts=answerParts(line);if(parts){append(parts.before);const meta=answerMetadata(parts.after),key=meta.key.replace(/[.،\s]/g,'');if(block.type==='mcq'){const index=['ا','ب','ج','د'].indexOf(key);if(index>=0)block.answer=index;else if(key)block.issues.push('مفتاح الإجابة يجب أن يكون أ أو ب أو ج أو د');}else if(block.type==='tf'){if(['صح','ص','true'].includes(key))block.answer=0;else if(['خطا','خ','false'].includes(key))block.answer=1;else if(key)block.issues.push('مفتاح الصح والخطأ يجب أن يكون صح أو خطأ');}if(meta.points!==null)block.points=meta.points;block.field=null;continue;}
 // Also accept a label without a colon; keep metadata out of printable text.
 if(/^(?:ا[ال]*جاب[ةه]\s+)?الصحيح[ةه]\s+/.test(normalized)){const fixed=line.replace(/(الصحيح[ةه])\s+/, '$1: '),parts=answerParts(fixed),meta=answerMetadata(parts.after),key=meta.key.replace(/[.،\s]/g,'');const index=block.type==='tf'?(['صح','ص','true'].includes(key)?0:['خطا','خ','false'].includes(key)?1:-1):['ا','ب','ج','د'].indexOf(key);if(index>=0)block.answer=index;else if(key)block.issues.push('مفتاح الإجابة غير صالح');if(meta.points!==null)block.points=meta.points;block.field=null;continue;}
 const grade=normalized.match(/^الدرج[ةه]\s*[:：]\s*(\d+(?:[.,]\d+)?)/);if(grade){block.points=Number(grade[1].replace(',','.'));block.field=null;continue;}
 append(line.replace(danglingAnswer,''));
 }
 const questions=[],errors=[];let skipped=0;for(const b of blocks){if(!b.text||/^اكتب (نص السؤال|العبارة)/.test(plain(b.text))){skipped++;continue;}const label=(b.type==='mcq'?'اختياري':b.type==='tf'?'صح وخطأ':'مقالي')+' '+b.number;const issues=[...b.issues];if(b.type==='mcq'){
  b.options.slice(0,choiceCount).forEach((o,i)=>{if(!o||plain(o).startsWith('اكتب الخيار'))issues.push('الخيار '+['أ','ب','ج','د'][i]+' غير مكتمل');});
  if(choiceCount===3&&(b.answer===3||b.options[3]&&!plain(b.options[3]).startsWith('اكتب الخيار')))issues.push('هذا الاختبار يستخدم ٣ خيارات؛ احذف الخيار د أو غيّر عدد الخيارات في معلومات الاختبار');
 }if(!Number.isFinite(b.points)||b.points<=0||b.points>100||(b.type==='essay'&&(!Number.isInteger(b.points)||b.points>15)))issues.push('درجة غير صالحة');errors.push(...issues.map(v=>label+': '+v));questions.push({type:b.type,text:b.text.trim(),options:b.type==='mcq'?b.options.slice(0,choiceCount).map(s=>s.trim()):b.type==='tf'?['صح','خطأ']:[],answer:b.type==='essay'?null:b.answer,points:b.points});}
 if(!blocks.length)errors.push('لم يُعثر على أسئلة بتنسيق القالب. استخدم قالب Word المتاح، أو صحّح النص المستخرج.');if(blocks.length&&!questions.length)errors.push('القالب فارغ؛ اكتب الأسئلة في Word ثم احفظه PDF.');if(questions.length>300)errors.push('يمكن استيراد ٣٠٠ سؤال في المرة الواحدة.');return {questions,errors,skipped};}
 return {clean,linesFromItems,normalizeAnswerLines,parse};
})();
if(typeof module!=='undefined')module.exports=QuestionFiles;

// Repair only identifiable imported metadata; keep question IDs and teacher edits.
function cleanImportedQuestionMetadata(q){
 const fields=[q.text,...(q.type==='mcq'?q.options:[])];
 if(!fields.some(value=>/الصحيح[ةه]/.test(QuestionFiles.clean(value))&&/الدرج[ةه]\s*[:：]/.test(QuestionFiles.clean(value))))return null;
 const label={mcq:'اختياري',tf:'صح وخطأ',essay:'مقالي'}[q.type];if(!label||q.type==='essay')return null;
 const source=label+' 01: '+q.text+'\n'+(q.type==='mcq'?q.options.map((o,i)=>['أ','ب','ج','د'][i]+': '+o).join('\n'):'');
 const parsed=QuestionFiles.parse(source),cleaned=parsed.questions[0];
 if(parsed.errors.length||!cleaned||cleaned.answer===null)return null;
 return {...q,text:cleaned.text,options:cleaned.options,answer:q.answer==null?cleaned.answer:q.answer};
}
function repairImportedQuestionMetadata(){let changed=false;for(const exam of db.exams)for(let i=0;i<exam.questions.length;i++){const cleaned=cleanImportedQuestionMetadata(exam.questions[i]);if(cleaned){exam.questions[i]=cleaned;changed=true;}}if(changed)save();}

let questionPdfSession=0,questionPdfState=null;
function questionFileButtons(){return btn('قالب أسئلة Word','wordTemplateModal()','light')+btn('استيراد أسئلة PDF','questionPdfModal()','light')+btn('تصدير أسئلة PDF','questionExportModal()','light');}
function wordTemplateModal(){
 modal('قالب أسئلة Word',`<form onsubmit="downloadWordQuestionTemplate(event)">
 <label class="field">اتجاه القالب<select name="orientation"><option value="landscape">أفقي</option><option value="portrait">عمودي</option></select></label>
 <div class="template-options">
 <label class="field">عدد الأسئلة الاختيارية<input name="mcq" type="number" min="0" max="25" value="10" required></label>
 <label class="field">عدد أسئلة الصح والخطأ<input name="tf" type="number" min="0" max="25" value="10" required></label>
 <label class="field">عدد خيارات السؤال الاختياري<select name="choices"><option value="3">ثلاثة خيارات (أ، ب، ج)</option><option value="4" selected>أربعة خيارات (أ، ب، ج، د)</option></select></label>
 </div>
 <p class="note">يمكن اختيار صفر لأحد النوعين، والحد الأعلى ٢٥ سؤالًا لكل نوع.</p>
 <button class="btn gold" type="submit">تنزيل قالب Word</button>
 </form><div class="callout">بعد التعبئة احفظ الملف من Word بصيغة PDF نصي، ثم اختر «استيراد أسئلة PDF». أبقِ عناوين الأسئلة وحروف الخيارات لتسهيل الاستيراد.</div>`);
}

function downloadWordQuestionTemplate(event){
 event.preventDefault();
 const form=event.currentTarget;
 const data=new FormData(form);
 const mcq=Number(data.get('mcq')), tf=Number(data.get('tf')), choices=Number(data.get('choices'));
 if(![mcq,tf].every(n=>Number.isInteger(n)&&n>=0&&n<=25)||![3,4].includes(choices))return;
 if(!mcq&&!tf){toast('اختر سؤالًا واحدًا على الأقل');return;}
 const landscape=data.get('orientation')==='landscape';
 const blob=new Blob([wordQuestionTemplate(mcq,tf,choices,landscape)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;
 link.download=`قالب-أسئلة-${landscape?'أفقي':'عمودي'}-${mcq}-${tf}.docx`;
 link.click();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}

function wordQuestionTemplate(mcq,tf,choices,landscape){
 const paragraph=(value,keepNext=false)=>`<w:p><w:pPr>${keepNext?'<w:keepNext/>':''}<w:bidi/><w:spacing w:after="80"/><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:rtl/><w:szCs w:val="26"/></w:rPr><w:t>${value}</w:t></w:r></w:p>`;
 const blocks=[];
 for(let i=1;i<=mcq;i++){
  blocks.push(paragraph(`اختياري ${i}: اكتب نص السؤال هنا`,true));
  for(const letter of ['أ','ب','ج','د'].slice(0,choices))blocks.push(paragraph(letter+': اكتب الخيار هنا',true));
  blocks.push(paragraph('الإجابة الصحيحة:'));
 }
 for(let i=1;i<=tf;i++){
  blocks.push(paragraph(`صح وخطأ ${i}: اكتب العبارة هنا`,true));
  blocks.push(paragraph('الإجابة الصحيحة:'));
 }
 const size=landscape?'w:w="16838" w:h="11906" w:orient="landscape"':'w:w="11906" w:h="16838"';
 return storeWordTemplateZip({
  '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  'word/document.xml':`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${blocks.join('')}<w:sectPr><w:pgSz ${size}/><w:pgMar w:top="950" w:right="950" w:bottom="950" w:left="950"/></w:sectPr></w:body></w:document>`
 });
}

// DOCX is a ZIP archive. Store the three small XML parts without compression.
function storeWordTemplateZip(files){
 const encoder=new TextEncoder(),local=[],central=[];
 let offset=0,centralSize=0;
 for(const [path,xml] of Object.entries(files)){
  const name=encoder.encode(path),data=encoder.encode(xml);
  let crc=-1;
  for(const byte of data){
   crc^=byte;
   for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  const entry=new Uint8Array(30+name.length),header=new DataView(entry.buffer);
  header.setUint32(0,0x04034b50,true);
  header.setUint16(4,20,true);
  header.setUint16(12,33,true);
  header.setUint32(14,~crc,true);
  header.setUint32(18,data.length,true);
  header.setUint32(22,data.length,true);
  header.setUint16(26,name.length,true);
  entry.set(name,30);
  const directory=new Uint8Array(46+name.length),record=new DataView(directory.buffer);
  record.setUint32(0,0x02014b50,true);
  record.setUint16(4,20,true);
  directory.set(entry.subarray(4,30),6);
  record.setUint32(42,offset,true);
  directory.set(name,46);
  local.push(entry,data);
  central.push(directory);
  offset+=entry.length+data.length;
  centralSize+=directory.length;
 }
 const end=new Uint8Array(22),footer=new DataView(end.buffer);
 footer.setUint32(0,0x06054b50,true);
 footer.setUint16(8,central.length,true);
 footer.setUint16(10,central.length,true);
 footer.setUint32(12,centralSize,true);
 footer.setUint32(16,offset,true);
 return [...local,...central,end];
}
function questionPdfModal(){questionPdfSession++;questionPdfState={target:getExam()?.id||null,parsed:null};const e=getExam();modal('استيراد أسئلة من PDF',`<p class="note">ارفع ملف PDF المحفوظ من قالب Word. تُقرأ الأسئلة داخل المتصفح، ثم تراجعها قبل إضافتها. الصور والملفات الممسوحة لا تُحوّل إلى نص هنا.</p><label class="field">ملف الأسئلة PDF<input id="question-pdf-file" type="file" accept="application/pdf,.pdf" onchange="readQuestionPDF(this.files[0])"></label><div class="form-grid"><label class="field">طريقة الإضافة<select id="question-pdf-mode" onchange="reviewQuestionPDF()"><option value="new">إنشاء اختبار جديد</option>${e?`<option value="append" ${!e.questions.length?'selected':''}>إضافة إلى ${esc(e.title)}</option>`:''}</select></label><label class="field">عنوان الاختبار الجديد<input id="question-pdf-title" maxlength="65" value="اختبار مستورد"></label><label class="field">المادة<input id="question-pdf-subject" maxlength="40" value="${esc(e?.subject||'')}"></label></div><label class="field">النص المستخرج قابل للمراجعة والتعديل<textarea id="question-pdf-text" rows="10" oninput="reviewQuestionPDF(true)" placeholder="ستظهر هنا الأسئلة بعد قراءة الملف…"></textarea></label><div id="question-pdf-preview" aria-live="polite"></div><label class="switch-row note"><input type="checkbox" id="question-pdf-reviewed">راجعت نصوص الأسئلة والخيارات والدرجات</label>${btn('إضافة الأسئلة إلى الموقع','commitQuestionPDF()')}`);}
async function readQuestionPDF(file){if(!file)return;const session=++questionPdfSession,preview=$('#question-pdf-preview');preview.innerHTML='<p class="note" role="status">جارٍ استخراج الأسئلة…</p>';questionPdfState.parsed=null;$('#question-pdf-text').value='';try{if(file.size>20*1024*1024)throw Error('الحد الأقصى للملف ٢٠ ميغابايت');const lib=await getPdf(),doc=await lib.getDocument({data:await file.arrayBuffer()}).promise;try{if(doc.numPages>30)throw Error('الحد الأقصى ٣٠ صفحة');const lines=[];for(let p=1;p<=doc.numPages;p++){const content=await(await doc.getPage(p)).getTextContent();lines.push(...QuestionFiles.linesFromItems(content.items));}if(session!==questionPdfSession||!$('#question-pdf-text'))return;if(!lines.length)throw Error('الملف لا يحتوي نصًا قابلًا للاستخراج. احفظ PDF من Word مباشرة بدل تصويره');$('#question-pdf-text').value=QuestionFiles.normalizeAnswerLines(lines.join('\n'));$('#question-pdf-title').value=file.name.replace(/\.pdf$/i,'').slice(0,65);reviewQuestionPDF();}finally{await doc.destroy();}}catch(e){if(session!==questionPdfSession||!$('#question-pdf-preview'))return;questionPdfState.parsed=null;preview.innerHTML=`<p class="import-error" role="alert">${esc(e.message)}</p>`;}}
function reviewQuestionPDF(userEdit=false){if(userEdit)questionPdfSession++;if(!questionPdfState||!$('#question-pdf-text'))return;const target=$('#question-pdf-mode').value==='append'?db.exams.find(e=>e.id===questionPdfState.target):null;const result=QuestionFiles.parse($('#question-pdf-text').value,target?examChoiceCount(target):4);questionPdfState.parsed=result;$('#question-pdf-reviewed').checked=false;$('#question-pdf-preview').innerHTML=`<p class="note">${ar(result.questions.filter(q=>q.type==='mcq').length)} اختياري · ${ar(result.questions.filter(q=>q.type==='tf').length)} صح وخطأ · ${ar(result.questions.filter(q=>q.type==='essay').length)} مقالي · ${ar(result.skipped)} سؤال فارغ متجاوز</p>${result.errors.length?`<div class="import-error" role="alert">${result.errors.slice(0,10).map(esc).join('<br>')}</div>`:'<div class="callout">الأسئلة جاهزة للمراجعة. يمكنك تعديل النصوص الطويلة في قسم الاختبارات قبل الطباعة. الإجابات التي لم تحددها تبقى فارغة في مفتاح الإجابة.</div>'}<div class="question-import-preview">${result.questions.slice(0,5).map(q=>`<div class="review-q"><b>${esc(q.text)}</b>${q.type==='mcq'?`<p class="note">${q.options.map((o,i)=>letters[i]+': '+esc(o)).join(' · ')}</p>`:''}<p class="note">${ar(q.points)} درجة · المفتاح: ${q.answer===null?'غير محدد':q.type==='tf'?(q.answer?'خطأ':'صح'):letters[q.answer]}</p></div>`).join('')}</div>`;}
function commitQuestionPDF(){const state=questionPdfState;if(!state?.parsed||state.parsed.errors.length||!state.parsed.questions.length)return toast('أكمل الأسئلة وصحّح الملاحظات أولًا');if(!$('#question-pdf-reviewed').checked)return toast('راجع الأسئلة ثم فعّل تأكيد المراجعة');const mode=$('#question-pdf-mode').value;const target=mode==='append'?db.exams.find(x=>x.id===state.target):null;const parsed=QuestionFiles.parse($('#question-pdf-text').value,target?examChoiceCount(target):4);if(parsed.errors.length||!parsed.questions.length)return reviewQuestionPDF();let e;if(mode==='append'){e=db.exams.find(x=>x.id===state.target);if(!e)return toast('الاختبار المحدد غير متاح');}else{const title=$('#question-pdf-title').value.trim(),subject=$('#question-pdf-subject').value.trim();if(!title||!subject)return toast('أدخل عنوان الاختبار والمادة');e={id:uid(),title,subject,group:'',duration:45,date:new Date().toISOString().slice(0,10),notes:'',questions:[]};db.exams.push(e);}e.questions.push(...parsed.questions.map(q=>({...q,options:[...q.options],id:uid()})));currentExam=e.id;save();questionPdfSession++;questionPdfState=null;closeModal();location.hash='exams';exams();toast('تمت إضافة الأسئلة؛ راجع مفتاح الإجابة قبل التصحيح');}
function questionExportModal(){const e=getExam();modal('تصدير أسئلة PDF',`<p class="note">اختر الاختبار لتصدير الأسئلة والخيارات فقط، ثم اختر «حفظ كـ PDF» من نافذة الطباعة. مفتاح الإجابة لا يظهر في النسخة المصدّرة.</p><label class="field">الاختبار<select id="question-export-exam">${options(db.exams.map(x=>[x.id,x.title]),e?.id||db.exams[0]?.id)}</select></label>${db.exams.length?btn('فتح معاينة التصدير PDF','exportQuestionPDF()'):empty('أنشئ اختبارًا أولًا','أضف الأسئلة ثم صدّرها PDF.')}`);}
function questionsExportHTML(e){return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(e.title)}</title><style>@page{size:A4;margin:16mm}body{font-family:Arial,Tahoma,sans-serif;color:#111;font-size:14px;line-height:1.6}h1{font-size:22px}h2{font-size:17px;margin:20px 0 8px}.question{break-inside:avoid;margin:0 0 14px}.choices p{margin:2px 0}.meta{font-size:12px;color:#555}button{padding:10px 20px;margin-bottom:20px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">حفظ كـ PDF / طباعة</button><h1>${esc(e.title)}</h1><p class="meta">${esc(e.subject)} · ${esc(e.group||'')} · ${ar(e.duration)} دقيقة</p>${['mcq','tf','essay'].map(type=>{const qs=e.questions.filter(q=>q.type===type);return qs.length?`<h2>${{mcq:'اختيار من متعدد',tf:'صح وخطأ',essay:'أجب عن الأسئلة التالية'}[type]}</h2>${qs.map((q,i)=>`<section class="question"><p>${{mcq:'اختياري',tf:'صح وخطأ',essay:'مقالي'}[type]} ${String(i+1).padStart(2,'0')}: ${esc(q.text)}</p>${type==='mcq'?`<div class="choices">${q.options.map((o,j)=>`<p>${letters[j]}: ${esc(o)}</p>`).join('')}</div>`:type==='tf'?'<p>صح ☐　خطأ ☐</p>':'<p>..........................................................................</p><p>..........................................................................</p>'}</section>`).join('')}`:'';}).join('')}</body></html>`;}
function exportQuestionPDF(){const e=db.exams.find(x=>x.id===$('#question-export-exam').value);if(!e?.questions.length)return toast('اختر اختبارًا يحتوي على أسئلة');const w=window.open('','_blank');if(!w)return toast('اسمح بفتح نافذة التصدير في المتصفح');w.document.write(questionsExportHTML(e));w.document.close();w.onload=()=>w.print();closeModal();}
