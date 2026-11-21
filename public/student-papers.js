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
