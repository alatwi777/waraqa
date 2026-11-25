'use strict';
function paperSearchText(value) {
 return String(value ?? '').normalize('NFKC').replace(/[٠-٩]/g, d => String(d.charCodeAt(0)-1632)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0)-1776)).replace(/[أإآ]/g,'ا').replace(/[\u064b-\u065f\u0640]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
}
function openStudentPaperSearch() {
 modal('بحث ورقة طالب', `<label class="field">اسم الطالب أو رقمه<input id="student-paper-query" type="search" autocomplete="off" placeholder="اكتب اسم الطالب أو رقمه…" oninput="renderStudentPaperSearch(this.value)"></label><div id="student-paper-matches" aria-live="polite"></div>`);
 renderStudentPaperSearch('');
 document.querySelector('#student-paper-query')?.focus();
}
function renderStudentPaperSearch(value) {
 const query=paperSearchText(value);
 const records=query ? db.results.filter(record => {
  const student=db.students.find(item => item.id===record.student);
  return [record.name,record.number,student?.name,student?.number].some(text => paperSearchText(text).includes(query));
 }) : [];
 const container=document.querySelector('#student-paper-matches');
 if(container) container.innerHTML=query ? studentPaperList(records) : '<p class="note">ابحث في جميع الاختبارات بالاسم أو الرقم للوصول إلى ورقة الطالب.</p>';
}
function openStudentExams(studentId) {
 const student=db.students.find(item => item.id===studentId);
 if(!student)return;
 const records=db.results.filter(record => record.student===student.id || (!record.student && (!record.group || record.group===student.group) && resultNumberKey(record.number) && resultNumberKey(record.number)===resultNumberKey(student.number)));
 modal('اختبارات '+student.name,studentPaperList(records));
}
function studentPaperList(records) {
 if(!records.length)return '<p class="note">لا توجد أوراق محفوظة مطابقة.</p>';
 return `<div class="student-paper-list">${records.map(record => {
  const exam=resultExam(record), pages=Object.keys(record.pages||{});
  return `<button type="button" class="student-paper-item" data-result-id="${esc(record.id)}" onclick="openSavedStudentPaper(this.dataset.resultId)"><strong>${esc(exam?.title||'اختبار محفوظ')}</strong><span>${esc(record.name||'طالب غير محدد')} · ${esc(record.number||'بدون رقم')} · ${esc(record.group||'')}</span><small>${record.captureStatus==='ungraded' ? 'لم تُصحح بعد' : 'الدرجة '+ar(score(record))+(exam ? ' / '+ar(total(exam)) : '')} · ${ar(pages.length)} صفحة · فتح الورقة ←</small></button>`;
 }).join('')}</div>`;
}
function openSavedStudentPaper(resultId) {
 const record=db.results.find(item => item.id===resultId);
 if(!record)return toast('لم تعد الورقة موجودة');
 closeModal();currentExam=record.exam;currentResult=resultId;
 if(location.hash==='#results')results();else location.hash='results';
}

let deletingStudents=false;
async function deleteStudentsAndPapers(id) {
 if(deletingStudents)return;
 if(batchProcessing || scanState?.remotePending || scanState?.saving || (typeof capturedGrading!=='undefined' && capturedGrading))
  return toast('أوقف التصحيح قبل حذف الطلاب وأوراقهم.');
 const roster=db.students, previous=db.results;
 const targets=id===undefined ? roster : roster.filter(student=>student.id===id);
 if(!targets.length)return;
 const ids=new Set(targets.map(student=>student.id));
 function ownsPaper(record) {
  if(record.student)return ids.has(record.student);
  const number=resultNumberKey(record.number);
  if(!number)return false;
  const matches=roster.filter(student=>resultNumberKey(student.number)===number && (!record.group || student.group===record.group));
  return matches.length>0 && matches.every(student=>ids.has(student.id));
 }
 const removed=previous.filter(ownsPaper), removedSet=new Set(removed);
 const label=id===undefined ? 'جميع الطلاب في كل المجموعات ('+ar(targets.length)+')' : 'الطالب '+targets[0].name;
 if(!confirm('حذف '+label+' نهائيًا مع أوراقهم ودرجاتهم وصور الإجابات؟ عدد النتائج المرتبطة: '+ar(removed.length)+'. ستبقى نماذج الاختبارات المشتركة.'))return;
 deletingStudents=true;
 try {
  db.students=roster.filter(student=>!ids.has(student.id));
  db.results=previous.filter(record=>!removedSet.has(record));
  try {if(save()===false)throw Error('save');}
  catch {db.students=roster;db.results=previous;return toast('تعذر حفظ الحذف.');}
  students();
  if(typeof flushLocalChanges==='function' && !await flushLocalChanges())return toast('تعذر تأكيد حفظ الحذف. احتفظ بنسخة من بياناتك.');
  const keys=new Set(removed.flatMap(record=>Object.values(record.pages||{})).filter(key=>typeof key==='string'));
  for(const record of db.results)for(const key of Object.values(record.pages||{}))keys.delete(key);
  if(keys.size){
   const store=await idb;
   await new Promise((resolve,reject)=>{
    const tx=store.transaction('files','readwrite'), files=tx.objectStore('files');
    for(const key of keys)files.delete(key);
    tx.oncomplete=resolve;
    tx.onerror=tx.onabort=()=>reject(tx.error);
   });
  }
  toast('تم حذف الطلاب المحددين وأوراقهم.');
 }catch{toast('تعذر إكمال تنظيف صور الأوراق من هذا المتصفح.');}
 finally{deletingStudents=false;}
}
