/* Bulk grading and direct-on-paper answer editing. Loaded after app.js. */
let bulkWaiting = false;
let bulkReviewActive = false;
let batchProcessing = false;
let batchRunId = '';
let resultHitContext = null;
let largeResultPreview = null;
let largeResultResizeObserver = null;

const originalOpenScan = openScan;
const originalRenderScan = renderScan;
const originalResults = results;
const originalReviewResult = reviewResult;
const originalDrawResultOverlay = drawResultOverlay;

let resultsExamFilter = '';

function resultNumberKey(value) {
  const digits = String(value ?? '').replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\D/g, '');
  return digits;
}
function resultStudentKey(r) {
  const st = db.students.find(x => x.id === r.student);
  const number = resultNumberKey(r.number || st?.number);
  return number ? 'number:' + number : (r.student ? 'student:' + r.student : '');
}
function resultMatchesStudent(r, st, examId = currentExam) {
  if (examId && r.exam !== examId) return false;
  const a = resultNumberKey(r.number || db.students.find(x => x.id === r.student)?.number);
  const b = resultNumberKey(st?.number);
  return (a && b && a === b) || (!!st?.id && r.student === st.id);
}
function mergeDuplicateStudentResults() {
  const groups = new Map();
  for (const r of db.results) {
    const identity = resultStudentKey(r);
    if (!r.exam || !identity) continue;
    const key = r.exam + '|' + identity;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  let changed = false;
  const remove = new Set();
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    list.sort((a,b) => String(a.date || '').localeCompare(String(b.date || '')));
    const base = list[0];
    base.pages ||= {}; base.markings ||= {}; base.reviewed ||= {}; base.answers ||= {}; base.essay ||= {};
    for (const source of list.slice(1)) {
      const sourcePages = Object.entries(source.pages || {}).sort((a,b) => Number(a[0])-Number(b[0]));
      const remap = {};
      for (const [oldPage, key] of sourcePages) {
        let target = Number(oldPage);
        if (base.pages[target]) {
          const expected = Math.max(1, resultPageCount(base));
          target = Array.from({length: expected}, (_,i)=>i).find(i => !base.pages[i]);
          if (target === undefined) target = Math.max(-1, ...Object.keys(base.pages).map(Number)) + 1;
        }
        base.pages[target] = key; remap[oldPage] = target;
        if (source.markings?.[oldPage]) base.markings[target] = { ...(base.markings[target] || {}), ...source.markings[oldPage] };
      }
      for (const [i, value] of Object.entries(source.answers || {})) if (source.reviewed?.[i] || !Object.hasOwn(base.answers, i)) base.answers[i] = value;
      for (const [i, value] of Object.entries(source.essay || {})) if (value !== null && value !== undefined || !Object.hasOwn(base.essay, i)) base.essay[i] = value;
      base.reviewed = { ...base.reviewed, ...(source.reviewed || {}) };
      base.name = source.name || base.name; base.number = source.number || base.number; base.group = source.group || base.group; base.student = source.student || base.student;
      base.batchAuto = !!(base.batchAuto || source.batchAuto);
      base.updated = [base.updated, source.updated, source.date].filter(Boolean).sort().at(-1) || base.updated;
      remove.add(source.id); changed = true;
    }
  }
  if (changed) { db.results = db.results.filter(r => !remove.has(r.id)); save(); }
  return changed;
}
function setResultsExamFilter(value) {
  resultsExamFilter = value || '';
  currentResult = null;
  results();
}

score = function (r) {
  const e = resultExam(r); if (!e) return 0;
  const essayScore = r.snapshot?.paperVersion >= 6 ? Math.min(essayMaximum(e), Math.max(0, Number(r.essay?.[-1] || 0))) : 0;
  return essayScore + e.questions.reduce((sum, q, i) => {
    if (q.type === 'essay') return sum + (r.snapshot?.paperVersion >= 6 ? 0 : Math.min(q.points, Math.max(0, Number(r.essay?.[i] || 0))));
    const double = Object.values(r.markings || {}).some(page => page?.[i]?.status === 'double');
    return sum + (!double && q.answer !== null && r.answers?.[i] === q.answer ? Number(q.points) : 0);
  }, 0);
};

openScan = async function () {
  if (bulkWaiting && !bulkReviewActive && scanQueue.length > 1) {
    location.hash = 'results';
    currentResult = null;
    results();
    return;
  }
  if (bulkWaiting && scanQueue.length <= 1) bulkWaiting = false;
  return originalOpenScan();
};

renderScan = function () {
  if (batchProcessing) return;
  originalRenderScan();
  if (!scanState) return;
  const layout = document.querySelector('.review-layout');
  if (!layout) return;
  const cards = layout.querySelectorAll(':scope > section');
  const imagePanel = cards[0]?.querySelector('.panel');
  const answerPanel = cards[1];
  if (imagePanel && !imagePanel.querySelector('.scan-top-actions')) {
    imagePanel.insertAdjacentHTML('afterbegin', `<div class="scan-top-actions"><span>الورقة ${ar(scanIndex + 1)} من ${ar(scanQueue.length)}</span><button class="btn light small" type="button" onclick="saveScan(false)">حفظ</button><button class="btn gold small" type="button" onclick="saveScan(true)">التالي ←</button></div>`);
  }
  if (answerPanel && !answerPanel.querySelector('.answers-top-save')) {
    answerPanel.insertAdjacentHTML('afterbegin', `<div class="answers-top-save"><strong>إجابات الطالب</strong><button class="btn light small" type="button" onclick="saveScan(false)">حفظ</button></div>`);
  }
  const image = document.querySelector('#scan-img');
  if (image) image.setAttribute('onclick', 'handleScanPaperClick(event)');
};

function scanPaperClickPoint(ev) {
  const im = ev.currentTarget, rect = im.getBoundingClientRect(), s = scanState;
  if (!s?.corners || !s.canvas || !s.orientationReady) return null;
  const scale = Math.min(rect.width / s.canvas.width, rect.height / s.canvas.height);
  const ox = (rect.width - s.canvas.width * scale) / 2, oy = (rect.height - s.canvas.height * scale) / 2;
  const x = (ev.clientX - rect.left - ox) / scale, y = (ev.clientY - rect.top - oy) / scale;
  if (x < 0 || y < 0 || x > s.canvas.width || y > s.canvas.height) return null;
  const map = homography(s.corners, s.version || 8), plan = scanPlan(s, getExam());
  let best = null;
  for (const v of plan.items) {
    if (v.q.type === 'essay') continue;
    for (const b of v.bubbles) {
      const bm = typeof bubblePointMap === 'function' ? bubblePointMap(s, map, v.i, b) : map;
      const pt = bm(b.x, b.y), edge = bm(b.x + b.r, b.y);
      const d = Math.hypot(pt.x - x, pt.y - y), radius = Math.hypot(edge.x - pt.x, edge.y - pt.y);
      if (d <= Math.max(radius * 1.55, 11) && (!best || d < best.d)) best = { i: v.i, value: b.value, d };
    }
  }
  return best;
}

function handleScanPaperClick(ev) {
  if (isManual) return pickCorner(ev);
  const hit = scanPaperClickPoint(ev);
  if (!hit) return;
  const s = scanState;
  s.answers[hit.i] = s.answers[hit.i] === hit.value ? null : hit.value;
  s.flags[hit.i] = s.answers[hit.i] === null ? 'فارغ — ترك السؤال دون إجابة' : 'تم تعديل الإجابة من صورة الورقة';
  s.readings ??= {};
  s.readings[hit.i] = s.answers[hit.i] === null ? [] : getExam().questions[hit.i].options.map((_, j) => j === s.answers[hit.i] ? 1 : 0);
  renderScan();
  toast('تم تعديل الإجابة من موضعها على الورقة');
}

async function saveScan(advance = true) {
  const s = scanState, e = getExam();
  if (!s?.student) return toast('اختر الطالب أولًا');
  const confirmBox = document.querySelector('#confirm-review');
  if (!confirmBox?.checked) return toast('راجع الإجابات ثم فعّل تأكيد المراجعة');
  const plan = scanPlan(s, e);
  if (plan.items.some(v => v.q.type === 'essay' && (s.essay[v.i] === null || s.essay[v.i] === undefined || !Number.isFinite(s.essay[v.i]) || s.essay[v.i] < 0 || s.essay[v.i] > v.q.points))) return toast('حدّد درجة المقالي المطلوبة قبل الحفظ. استخدم ٠ للدرجة الصفرية، ولا تتركها فارغة.');
  const st = db.students.find(x => x.id === s.student);
  if (!st) return toast('تعذر العثور على بيانات الطالب');
  let r = db.results.find(x => x.exam === e.id && resultMatchesStudent(x, st));
  if (r && r.pages[s.p] && !s.savedThisVisit && !confirm('هذه الصفحة محفوظة. هل تريد استبدالها؟')) return;
  try {
    if (!r) r = { id: uid(), exam: e.id, student: st.id, name: st.name, number: st.number, group: st.group, snapshot: { ...JSON.parse(JSON.stringify(e)), paperVersion: s.version || 8 }, answers: {}, essay: {}, pages: {}, reviewed: {}, date: new Date().toISOString() };
    else if (JSON.stringify(r.snapshot.questions) !== JSON.stringify(e.questions) || (r.snapshot.paperVersion || 1) !== (s.version || 8)) return toast('تغير الاختبار بعد التصحيح. أنشئ اختبارًا منفصلًا للنسخة المعدلة.');
    const key = r.id + '-' + s.p + '-' + uid();
    await filePut(key, s.url);
    r.pages[s.p] = key; r.markings ??= {}; r.markings[s.p] = {};
    for (const { i, q } of plan.items) {
      r.answers[i] = s.answers[i] ?? null; r.essay[i] = q.type === 'essay' ? s.essay[i] : 0; r.reviewed[i] = true;
      if (q.type !== 'essay') { const status = scanAnswerStatus(q, i, s); r.markings[s.p][i] = { status, marked: scanMarkedValues(i, s, status) }; }
    }
    if (s.version >= 6) for (const v of paperPlan(e, s.version)[s.p].items) r.reviewed[v.i] = true;
    r.updated = new Date().toISOString();
    if (!db.results.some(x => x.id === r.id)) db.results.push(r);
    save(); s.savedThisVisit = true;
    if (!advance) { renderScan(); toast('تم حفظ الورقة'); return; }
    scanIndex++;
    if (scanIndex < scanQueue.length) { await openScan(); toast('حُفظت الصفحة. انتقلت إلى الورقة التالية.'); }
    else { scanState = null; scanQueue = []; bulkWaiting = false; bulkReviewActive = false; currentResult = r.id; location.hash = 'results'; results(); toast('تم حفظ النتائج والمراجعة'); }
  } catch { toast('تعذر حفظ الصورة. تحقق من مساحة الجهاز وأعد المحاولة.'); }
}

function issueCounts(r, p = null) {
  const e = resultExam(r), out = { double: 0, blank: 0, wrong: 0, correct: 0, unresolved: 0, essayPending: 0 };
  if (!e) return out;
  if (r.snapshot?.paperVersion >= 6) out.essayPending = essayMaximum(e) > 0 && (r.essay?.[-1] === null || r.essay?.[-1] === undefined) ? 1 : 0;
  for (const [i, q] of e.questions.entries()) {
    if (q.type === 'essay') { if (r.snapshot?.paperVersion < 6 && (r.essay?.[i] === null || r.essay?.[i] === undefined)) out.essayPending++; continue; }
    if (p !== null && !r.reviewed?.[i]) continue;
    const state = resultAnswerStatus(r, q, i, p ?? Number(Object.keys(r.pages || {})[0] || 0));
    if (out[state] !== undefined) out[state]++;
  }
  return out;
}

function answerSheetsExportModal() {
  const available = db.results.filter(r => Object.keys(r.pages || {}).length);
  if (!available.length) return toast('لا توجد أوراق محفوظة للتصدير');
  const exams = [...new Map(available.map(r => { const e = resultExam(r); return [e?.id || r.exam, e]; }).filter(([, e]) => e).map(([id, e]) => [id, e])).values()];
  modal('تصدير أوراق إجابات الطلاب', `<p class="note">يُجهّز ملف طباعة متعدد الصفحات بصور أوراق الطلاب، مع علامات إجاباتهم فقط. لن تظهر دوائر إجابة المعلم الصفراء. بعد فتح المعاينة اختر «حفظ بصيغة PDF» من نافذة الطباعة.</p><label class="field">الاختبار<select id="answer-export-exam"><option value="all">جميع الاختبارات</option>${options(exams.map(e => [e.id, e.title]))}</select></label>${btn('تجهيز الأوراق','exportAnswerSheets()')}`);
}

function makeStudentAnswerSheetImage(source, r, p) {
  return new Promise(async (resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const width = image.naturalWidth, height = image.naturalHeight;
        if (!width || !height) throw new Error('الصورة بلا أبعاد');
        const holder = document.createElement('div');
        holder.setAttribute('aria-hidden', 'true');
        Object.assign(holder.style, { position: 'fixed', left: '-20000px', top: '0', width: `${width}px`, height: `${height}px`, opacity: '0', pointerEvents: 'none', overflow: 'hidden' });
        image.style.display = 'block'; image.style.width = `${width}px`; image.style.height = `${height}px`;
        const overlay = document.createElement('canvas');
        overlay.style.width = `${width}px`; overlay.style.height = `${height}px`;
        holder.append(image, overlay); document.body.append(holder);
        // Use only the original student-mark renderer; the wrapper renderer adds
        // the teacher's yellow answer circle, which is intentionally excluded.
        originalDrawResultOverlay(r, p, image, overlay);
        const output = document.createElement('canvas'); output.width = width; output.height = height;
        const ctx = output.getContext('2d'); ctx.drawImage(image, 0, 0); ctx.drawImage(overlay, 0, 0);
        const data = output.toDataURL('image/jpeg', 0.94);
        holder.remove(); output.width = output.height = 1;
        resolve(data);
      } catch (error) { reject(error); }
    };
    image.onerror = () => reject(new Error('تعذر تحميل صورة الورقة'));
    image.src = source;
  });
}

async function exportAnswerSheets() {
  const popup = window.open('', '_blank');
  if (!popup) return toast('اسمح بفتح نافذة التصدير في إعدادات Safari');
  popup.document.write('<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>تصدير أوراق الإجابات</title><body style="font:18px Tahoma,Arial,sans-serif;padding:32px;text-align:center">جارٍ تجهيز أوراق الطلاب… اترك النافذة مفتوحة.</body></html>');
  popup.document.close();
  const examId = document.querySelector('#answer-export-exam')?.value || 'all';
  const records = db.results.filter(r => (examId === 'all' || r.exam === examId || resultExam(r)?.id === examId) && Object.keys(r.pages || {}).length);
  const pages = [], skipped = [];
  for (const r of records) {
    const e = resultExam(r);
    for (const p of Object.keys(r.pages || {}).sort((a,b) => Number(a)-Number(b))) {
      try {
        const source = await fileGet(r.pages[p]);
        if (!source) throw new Error('الصورة غير موجودة');
        const image = await makeStudentAnswerSheetImage(source, r, Number(p));
        pages.push(`<section class="sheet"><img src="${image}" alt="ورقة إجابات ${esc(r.name || 'الطالب')}"></section>`);
      } catch { skipped.push(`${r.number || r.name || 'طالب'} — ${Number(p)+1}`); }
    }
  }
  if (!pages.length) { popup.close(); return toast('لم نتمكن من تجهيز أي ورقة؛ تحقق من توفر صور النتائج'); }
  const note = skipped.length ? `<p class="warning">تعذر تضمين ${ar(skipped.length)} صفحة لعدم توفر صورتها.</p>` : '';
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>أوراق إجابات الطلاب</title><style>@page{size:A4 landscape;margin:7mm}*{box-sizing:border-box}html,body{margin:0;padding:0;font-family:Tahoma,Arial,sans-serif}.sheet{height:196mm;width:100%;display:grid;place-items:center;page-break-after:always;break-after:page}.sheet:last-child{page-break-after:auto;break-after:auto}.sheet img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}.warning{padding:14px;color:#8a4b00;background:#fff5df}@media screen{body{padding:14px;background:#eef2ed}.sheet{margin:0 auto 14px;max-width:1100px;height:70vh;background:#fff;box-shadow:0 2px 14px #0002}.sheet img{max-height:68vh}.warning{text-align:center}}</style></head><body>${note}${pages.join('')}<script>window.addEventListener('load',()=>setTimeout(()=>{window.focus();window.print()},500))<\/script></body></html>`);
  popup.document.close(); closeModal();
  toast(`تم تجهيز ${ar(pages.length)} صفحة${skipped.length ? ` · تعذر ${ar(skipped.length)}` : ''}`);
}

async function exportResultsExcel() {
  if (!db.results.length) return toast('لا توجد نتائج للتصدير');
  try {
    const XLSX = await loadStudentSheetLibrary();
    const safe = value => { const text = String(value ?? ''); return /^[=+\-@]/.test(text) ? `'${text}` : text; };
    const gradeRows = [['رقم الطالب','اسم الطالب','المجموعة','الاختبار','الدرجة','الدرجة الكلية','درجة المقالي','تاريخ الرصد'], ...db.results.map(r => {
      const e = resultExam(r), essay = r.snapshot?.paperVersion >= 6 ? Number(r.essay?.[-1] || 0) : Object.entries(r.essay || {}).filter(([key]) => key !== '-1').reduce((sum,[,value]) => sum + Number(value || 0), 0);
      return [safe(r.number), safe(r.name), safe(r.group), safe(e?.title), score(r), e ? total(e) : 0, essay, r.updated || r.date || ''];
    })];
    const answerRows = [['رقم الطالب','اسم الطالب','الاختبار','نوع السؤال','رقم السؤال','إجابة الطالب','إجابة المفتاح','الحالة','الدرجة'], ...db.results.flatMap(r => {
      const e = resultExam(r); if (!e) return [];
      return e.questions.map((q,i) => {
        const p = Number(Object.keys(r.pages || {}).sort((a,b)=>Number(a)-Number(b))[0] || 0);
        const status = q.type === 'essay' ? 'مقالي' : resultAnswerStatus(r,q,i,p);
        const answer = q.type === 'essay' ? (r.snapshot?.paperVersion >= 6 ? 'ضمن مجموع المقالي' : Number(r.essay?.[i] || 0)) : (r.answers?.[i] == null ? 'متروك' : q.type === 'tf' ? (Number(r.answers[i]) ? 'خطأ' : 'صح') : safe(q.options?.[Number(r.answers[i])] || letters[Number(r.answers[i])]));
        const key = q.type === 'essay' ? '—' : q.answer === null || q.answer === undefined ? 'لم يُحدد' : q.type === 'tf' ? (Number(q.answer) ? 'خطأ' : 'صح') : safe(q.options?.[Number(q.answer)] || letters[Number(q.answer)] || '');
        const statusText = ({correct:'صحيحة',wrong:'خاطئة',double:'تظليل مزدوج',blank:'متروكة',unresolved:'تحتاج مراجعة'})[status] || status;
        return [safe(r.number),safe(r.name),safe(e.title),q.type==='mcq'?'اختياري':q.type==='tf'?'صح وخطأ':'مقالي',questionNumber(e,i),answer,key,statusText,Number(q.points || 0)];
      });
    })];
    const workbook = XLSX.utils.book_new();
    const grades = XLSX.utils.aoa_to_sheet(gradeRows), answers = XLSX.utils.aoa_to_sheet(answerRows);
    grades['!cols'] = [{wch:18},{wch:30},{wch:24},{wch:36},{wch:12},{wch:14},{wch:14},{wch:22}];
    answers['!cols'] = [{wch:18},{wch:30},{wch:36},{wch:14},{wch:12},{wch:34},{wch:34},{wch:20},{wch:12}];
    for (const sheet of [grades,answers]) if (sheet['!ref']) sheet['!autofilter'] = { ref: sheet['!ref'] };
    XLSX.utils.book_append_sheet(workbook, grades, 'الدرجات');
    XLSX.utils.book_append_sheet(workbook, answers, 'الإجابات');
    XLSX.writeFile(workbook, `ورقة-النتائج-${new Date().toISOString().slice(0,10)}.xlsx`, { compression: true });
    toast('تم تصدير ملف Excel');
  } catch (error) { console.error(error); toast('تعذر إنشاء ملف Excel؛ حدّث الصفحة وأعد المحاولة'); }
}

results = function () {
  mergeDuplicateStudentResults();
  if (currentResult && db.results.some(r => r.id === currentResult)) return reviewResult(currentResult);
  const pendingList = bulkWaiting && scanQueue.length ? `<div class="bulk-file-list" aria-label="الأوراق المضافة">${scanQueue.map((f,i)=>`<span><b>${ar(i+1)}</b> ${esc(f.name)} <small>بانتظار التصحيح</small></span>`).join('')}</div>` : '';
  const base = `<section class="panel bulk-batch-panel"><div><strong>دفعة أوراق التصحيح</strong><p class="note">${bulkWaiting && scanQueue.length ? `${ar(scanQueue.length)} ورقة أُضيفت إلى النتائج، جاهزة للمعالجة.` : 'ارفع مجموعة صور أو ملف PDF من قسم التصحيح لتجهيز دفعة.'}</p></div><div class="actions">${bulkWaiting && scanQueue.length ? `<button class="btn gold" onclick="correctAllPending()" ${batchProcessing ? 'disabled' : ''}>${batchProcessing ? 'جارٍ التصحيح…' : 'تصحيح الكل'}</button><button class="btn light" onclick="startBatchReview()">مراجعة الأوراق يدويًا</button><button class="btn light small" onclick="cancelPendingBatch()">إلغاء الدفعة</button>` : `<a class="btn light" href="#scan">اختيار أوراق للتصحيح</a>`}</div>${pendingList}<p id="batch-progress" class="note" aria-live="polite"></p></section>`;
  const examIds = [...new Set(db.results.map(r => r.exam).filter(Boolean))];
  if (!resultsExamFilter || !examIds.includes(resultsExamFilter)) resultsExamFilter = examIds.at(-1) || 'all';
  const examItems = examIds.map(id => { const e = db.exams.find(x => x.id === id) || db.results.find(x => x.exam === id)?.snapshot; return e ? [id, e.title || 'اختبار'] : null; }).filter(Boolean);
  const filtered = resultsExamFilter === 'all' ? db.results : db.results.filter(r => r.exam === resultsExamFilter);
  const filterBar = `<div class="toolbar results-exam-filter"><label class="field">اختر الاختبار<select aria-label="تصفية النتائج حسب الاختبار" onchange="setResultsExamFilter(this.value)"><option value="all" ${resultsExamFilter === 'all' ? 'selected' : ''}>جميع الاختبارات</option>${options(examItems, resultsExamFilter)}</select></label><span class="note">عدد أوراق الطلاب: ${ar(filtered.length)}</span></div>`;
  const rows = filtered.slice().reverse().map(r => {
    const e = resultExam(r), complete = Object.keys(r.pages || {}).length >= resultPageCount(r), c = issueCounts(r);
    return `<tr><td><strong>${esc(r.number || '—')}</strong></td><td><span class="avatar">${esc((r.name || '?')[0])}</span>${esc(r.name || 'طالب غير معروف')}</td><td>${esc(e?.title || 'اختبار محذوف')}</td><td><strong>${ar(score(r))}</strong> / ${ar(e ? total(e) : 0)}</td><td><span class="tag ${complete ? '' : 'amber'}">${r.batchAuto ? 'تصحيح آلي — راجع الحالات' : complete ? 'راجَعها المعلم' : 'صفحات ناقصة'}</span><div class="issue-counts">${[['double','مزدوج'],['blank','متروك'],['wrong','خاطئ']].map(([k,n]) => `<button class="issue-chip ${k}" onclick="openResultIssue('${r.id}','${k}')">${n} ${ar(c[k])}</button>`).join('')}<span class="issue-chip">مقالي للمراجعة ${ar(c.essayPending)}</span></div></td><td><button class="text-link" onclick="reviewResult('${r.id}')">معاينة وتعديل ←</button> <button class="delete-link" type="button" onclick="deleteResult('${r.id}')">حذف</button></td></tr>`;
  }).join('');
  const noResults = !db.results.length ? empty('نتائج تستحق الاحتفاء','ابدأ برفع أول ورقة في قسم التصحيح.',`<a class="btn light small" href="#scan">الانتقال للتصحيح</a>`) : empty('لا توجد نتائج لهذا الاختبار','اختر اختبارًا آخر من القائمة أعلاه.');
  $('#app').innerHTML = head('النتائج والتقارير', 'الورقة الأصلية، الإجابات، والدرجة. كل شيء قابل للمراجعة.', btn('تصدير أوراق الإجابات','answerSheetsExportModal()','light')+btn('تصدير Excel','exportResultsExcel()','light')+btn('تصدير CSV','exportResults()','light')) + base + `<section class="panel">${filterBar}<div class="table-wrap"><table><thead><tr><th>رقم الطالب</th><th>الطالب</th><th>الاختبار</th><th>الدرجة</th><th>الحالة والإجابات</th><th>الورقة</th></tr></thead><tbody>${rows}</tbody></table></div>${filtered.length ? '' : noResults}</section>`;
};

function startBatchReview() { if (!scanQueue.length) return toast('لا توجد دفعة جاهزة'); bulkReviewActive = true; scanIndex = 0; currentResult = null; location.hash = 'scan'; openScan(); }
async function cancelPendingBatch() { if (!confirm('إلغاء الدفعة الحالية؟')) return; const docs = new Set(scanQueue.map(x => x.pdf?.doc).filter(Boolean)); for (const doc of docs) try { await doc.destroy(); } catch {} scanQueue = []; scanState = null; bulkWaiting = bulkReviewActive = false; results(); }

async function correctAllPending() {
  if (!scanQueue.length || batchProcessing) return toast('لا توجد دفعة جاهزة للتصحيح');
  batchProcessing = true; batchRunId = uid(); bulkReviewActive = false; scanIndex = 0; currentResult = null; results();
  const runButton = document.querySelector('.bulk-batch-panel .btn.gold');
  if (runButton) { runButton.disabled = true; runButton.textContent = 'جارٍ التصحيح…'; }
  const progress = document.querySelector('#batch-progress'); let done = 0, failed = [];
  for (scanIndex = 0; scanIndex < scanQueue.length; scanIndex++) {
    try {
      scanState = null;
      await originalOpenScan();
      const s = scanState, e = db.exams.find(x => x.id === s?.exam);
      if (!s || !e) throw new Error('تعذر قراءة صفحة الاختبار');
      if (typeof identifyScanStudent === 'function') await identifyScanStudent(s, true);
      const student = db.students.find(x => x.id === s.student);
      if (!student) throw new Error('تعذر التعرف على رقم الطالب');
      let r = db.results.find(x => x.exam === e.id && resultMatchesStudent(x, student, e.id));
      let page = Number(s.p || 0);
      if (r?.pages?.[page]) {
        const expected = Math.max(1, resultPageCount(r));
        const nextPage = Array.from({length: expected}, (_,i)=>i).find(i => !r.pages[i]);
        if (nextPage !== undefined) page = nextPage;
      }
      if (Number(s.p || 0) !== page) { s.p = page; detectAndRead(); }
      const plan = scanPlan(s, e), id = r?.id || uid(), pageKey = id + '-' + page + '-' + uid();
      await filePut(pageKey, s.url);
      if (!r) {
        r = { id, exam: e.id, student: student.id, name: student.name, number: student.number, group: student.group, snapshot: { ...JSON.parse(JSON.stringify(e)), paperVersion: s.version || 8 }, answers: {}, essay: {}, pages: {}, reviewed: {}, markings: {}, date: new Date().toISOString(), batchAuto: true, batchRunId };
        db.results.push(r);
      }
      r.pages ||= {}; r.markings ||= {}; r.pages[page] = pageKey; r.markings[page] = {};
      for (const { i, q } of plan.items) {
        r.answers[i] = s.answers[i] ?? null;
        if (q.type === 'essay') {
          const grade = i === -1 ? s.essay?.[-1] : s.essay?.[i];
          if (grade !== null && grade !== undefined) r.essay[i] = grade;
        }
        r.reviewed[i] = true;
        if (q.type !== 'essay') { const status = scanAnswerStatus(q, i, s); r.markings[page][i] = { status, marked: scanMarkedValues(i, s, status) }; }
      }
      r.batchAuto = true; r.batchRunId = batchRunId; r.updated = new Date().toISOString();
      save(); done++;
    } catch (err) { failed.push(scanQueue[scanIndex]?.name || `ورقة ${scanIndex + 1}`); }
    if (progress) progress.textContent = `تم تصحيح ${ar(done)} من ${ar(scanQueue.length)}${failed.length ? ` · تعذر فتح ${ar(failed.length)} ورقة` : ''}`;
  }
  batchProcessing = false; bulkWaiting = false; scanQueue = []; scanState = null; scanIndex = 0; if (db.results.length) resultsExamFilter = db.results.at(-1).exam || resultsExamFilter; save(); results();
  toast(`اكتمل التصحيح الآلي: ${ar(done)} ورقة${failed.length ? `، وتعذر معالجة ${ar(failed.length)}` : ''}`);
}

function openResultIssue(id, kind) { currentResult = id; reviewResult(id).then(() => { const r = db.results.find(x => x.id === id), e = resultExam(r); const q = e.questions.findIndex((x, i) => x.type !== 'essay' && resultAnswerStatus(r, x, i, Number(Object.keys(r.pages)[0] || 0)) === kind); if (q >= 0) setTimeout(() => document.querySelector(`#result-q-${q}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); }); }

reviewResult = async function (id, p = 0) {
  await originalReviewResult(id, p);
  const r = db.results.find(x => x.id === id); if (!r) return;
  const imagePanel = document.querySelector('.review-layout > section:first-child');
  if (imagePanel && !imagePanel.querySelector('.result-edit-hint')) imagePanel.insertAdjacentHTML('beforeend', '<p class="note result-edit-hint">اضغط فقاعة الإجابة لتعديلها، أو فقاعة مجموع المقالي أعلى الورقة لرصد الدرجة. النقر على الفقاعة المحددة يمسحها.</p>');
  const imageToolbar = imagePanel?.querySelector('.toolbar');
  if (imageToolbar && !imageToolbar.querySelector('.result-page-number-nav')) imageToolbar.insertAdjacentHTML('afterbegin', resultPageButtons(r, p));
  if (imageToolbar && !imageToolbar.querySelector('.result-paper-actions')) imageToolbar.insertAdjacentHTML('beforeend', `<div class="result-paper-actions"><button type="button" class="btn light small" onclick="previousResultPaper('${r.id}')">→ السابق</button><button type="button" class="btn gold small next-result-paper" onclick="nextResultPaper('${r.id}')">التالي ←</button><button type="button" class="btn light small" onclick="openLargeResultPreview('${r.id}',${p})">معاينة</button></div>`);
  if (!r.student) {
    const answerPanel = document.querySelector('.review-layout > section:last-child');
    if (answerPanel && !answerPanel.querySelector('.unknown-student-select')) answerPanel.insertAdjacentHTML('afterbegin', `<label class="field unknown-student-select">تعذر التعرف على الطالب من رقم الورقة<select onchange="assignBatchStudent('${r.id}',this.value)"><option value="">اختر الطالب لربط النتيجة</option>${options(db.students.map(st=>[st.id,st.number+' — '+st.name]))}</select></label>`);
  }
  resultExam(r)?.questions.forEach((q, i) => {
    const card = [...document.querySelectorAll('.review-layout > section:last-child .review-q')].find(el => el.querySelector('b')?.textContent.includes(q.text));
    if (card) card.id = `result-q-${i}`;
  });
  const context = getResultHitContext(r, p); resultHitContext = context;
  const canvas = document.querySelector('#result-overlay');
  if (canvas) { canvas.style.pointerEvents = 'auto'; canvas.style.cursor = 'crosshair'; canvas.onclick = ev => handleResultPaperClick(ev, r.id, p); }
  const counts = issueCounts(r, p);
  const scorePanel = document.querySelector('.result-score');
  document.querySelector('.result-issue-summary')?.remove();
  if (scorePanel) scorePanel.insertAdjacentHTML('afterend', `<div class="result-issue-summary">${[['double','تظليل مزدوج'],['blank','متروك'],['wrong','إجابة خاطئة'],['correct','صحيحة']].map(([k,n]) => `<button class="issue-chip ${k}" onclick="openResultIssue('${r.id}','${k}')">${n}: ${ar(counts[k])}</button>`).join('')}<span class="issue-chip">مقالي للمراجعة: ${ar(counts.essayPending)}</span></div>`);
};

drawResultOverlay = function (r, p, im = document.querySelector('#result-image'), canvas = document.querySelector('#result-overlay')) {
  originalDrawResultOverlay(r, p, im, canvas);
  const e = resultExam(r), context = getResultHitContext(r, p, im, canvas);
  if (context && e) {
    const ctx = canvas.getContext('2d');
    context.plan.items.forEach(item => {
      if (item.q.type === 'essay' || resultAnswerStatus(r, item.q, item.i, p) !== 'wrong') return;
      const key = Number(item.q.answer);
      const bubble = item.bubbles.find(candidate => Number(candidate.value) === key);
      if (!bubble) return;
      const pointMap = typeof bubblePointMap === 'function' ? bubblePointMap(context.state, context.map, item.i, bubble) : context.map;
      const point = pointMap(bubble.x, bubble.y), edge = pointMap(bubble.x + bubble.r, bubble.y);
      const radius = Math.hypot(edge.x - point.x, edge.y - point.y) * context.scale;
      ctx.save(); ctx.strokeStyle = '#f4bd16'; ctx.lineWidth = Math.max(3, context.im.naturalWidth / 420); ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 2;
      ctx.beginPath(); ctx.arc(context.ox + point.x * context.scale, context.oy + point.y * context.scale, radius + 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    });
  }
  if (canvas) { canvas.style.pointerEvents = 'auto'; canvas.style.cursor = 'crosshair'; canvas.onclick = ev => handleResultPaperClick(ev, r.id, p, getResultHitContext(r, p, im, canvas)); }
  resultHitContext = getResultHitContext(r, p, im, canvas);
  const grade = resultHitContext?.plan.items.find(v => v.i === -1 && v.q.type === 'essay');
  const value = Number(r.essay?.[-1]);
  if (grade && value > 0) {
    const b = grade.bubbles.find(x => Number(x.value) === value);
    if (b) {
      const ctx = resultHitContext, bm = typeof bubblePointMap === 'function' ? bubblePointMap(ctx.state, ctx.map, -1, b) : ctx.map;
      const pt = bm(b.x, b.y), edge = bm(b.x + b.r, b.y), radius = Math.hypot(edge.x - pt.x, edge.y - pt.y) * ctx.scale;
      const x = canvas.getContext('2d'); x.strokeStyle = '#16834f'; x.lineWidth = Math.max(2, ctx.im.naturalWidth / 550); x.beginPath(); x.arc(ctx.ox + pt.x * ctx.scale, ctx.oy + pt.y * ctx.scale, radius + 2, 0, Math.PI * 2); x.stroke();
    }
  }
};

function getResultHitContext(r, p, im = document.querySelector('#result-image'), c = document.querySelector('#result-overlay')) {
  if (!im?.complete || !im.naturalWidth || !c?.width) return null;
  const tmp = document.createElement('canvas'); tmp.width = im.naturalWidth; tmp.height = im.naturalHeight; tmp.getContext('2d').drawImage(im, 0, 0);
  const corners = findMarkers(tmp); if (!corners) return null;
  const version = r.snapshot?.paperVersion || 1, e = resultExam(r), state = { version, p, answers: r.answers, essay: r.essay, markings: r.markings?.[p] || {} }, plan = scanPlan(state, e);
  try { const map = homography(corners, version), registration = typeof registerBubbleRings === 'function' ? registerBubbleRings(tmp, map, plan) : null; state.bubbleRegistration = registration;
    const scale = Math.min(c.clientWidth / im.naturalWidth, c.clientHeight / im.naturalHeight), ox = (c.clientWidth - im.naturalWidth * scale) / 2, oy = (c.clientHeight - im.naturalHeight * scale) / 2;
    return { r, p, im, c, state, plan, map, scale, ox, oy };
  } catch { return null; }
}

function handleResultPaperClick(ev, id, p, context = null) {
  const r = db.results.find(x => x.id === id), ctx = context || getResultHitContext(r, p);
  if (!ctx || !r) return;
  const rect = ctx.c.getBoundingClientRect(), x = (ev.clientX - rect.left - ctx.ox) / ctx.scale, y = (ev.clientY - rect.top - ctx.oy) / ctx.scale;
  let best = null;
  for (const v of ctx.plan.items) { if (v.q.type === 'essay' && v.i !== -1) continue; for (const b of v.bubbles) {
    const bm = typeof bubblePointMap === 'function' ? bubblePointMap(ctx.state, ctx.map, v.i, b) : ctx.map, pt = bm(b.x, b.y), edge = bm(b.x + b.r, b.y), radius = Math.hypot(edge.x - pt.x, edge.y - pt.y);
    const d = Math.hypot(pt.x - x, pt.y - y); if (d <= Math.max(radius * 1.55, 11) && (!best || d < best.d)) best = { i: v.i, value: b.value, d };
  }}
  if (!best) return;
  if (best.i === -1) {
    const grade = Number(r.essay?.[-1]) === Number(best.value) ? null : Number(best.value);
    r.essay ??= {}; r.essay[-1] = grade; r.updated = new Date().toISOString(); save(); refreshResultAndLargePreview(r, p, ctx);
    toast(grade === null ? 'أُلغي رصد مجموع المقالي' : `تم رصد ${ar(grade)} درجة للمقالي`); return;
  }
  const q = resultExam(r).questions[best.i], value = r.answers[best.i] === best.value ? null : best.value;
  r.answers[best.i] = value; r.reviewed[best.i] = true; r.markings ??= {}; r.markings[p] ??= {};
  r.markings[p][best.i] = { status: value === null ? 'blank' : value === q.answer ? 'correct' : 'wrong', marked: value === null ? [] : [value] };
  r.updated = new Date().toISOString(); save(); refreshResultAndLargePreview(r, p, ctx); toast('تم تعديل الإجابة من الورقة وحفظ الدرجة');
}

function refreshResultAndLargePreview(r, p, ctx) {
  const isLarge = ctx?.c?.id === 'large-result-overlay';
  reviewResult(r.id, p).then(() => {
    if (!isLarge) return;
    const image = document.querySelector('#large-result-image'), overlay = document.querySelector('#large-result-overlay');
    renderLargeResultPanels(r, p);
    if (image?.complete && image.naturalWidth && overlay) drawResultOverlay(r, p, image, overlay);
  });
}

function resultPageButtons(r, selected, large = false) {
  const pages = Object.keys(r.pages || {}).sort((a,b)=>Number(a)-Number(b));
  if (pages.length < 2) return '';
  const className = large ? 'large-result-page-nav' : 'result-page-number-nav';
  const buttons = pages.map(page => `<button type="button" class="btn ${Number(page) === Number(selected) ? 'gold' : 'light'} small" title="صفحة ${ar(Number(page)+1)}" aria-label="الانتقال إلى الصفحة ${ar(Number(page)+1)}" ${Number(page) === Number(selected) ? 'aria-current="page"' : ''} onclick="${large ? `switchLargeResultPage('${r.id}',${Number(page)})` : `reviewResult('${r.id}',${Number(page)})`}">${ar(Number(page)+1)}</button>`).join('');
  return `<div class="${className}" role="group" aria-label="صفحات ورقة الطالب" style="display:flex;align-items:center;gap:8px;margin:8px 0;justify-content:center"><span class="note">الصفحة</span>${buttons}</div>`;
}

function resultPreviewChoice(q, index) {
  if (q.type === 'essay') return 'يُصحح يدويًا';
  const answer = q.answer;
  if (answer === null || answer === undefined || answer === '') return 'لم يُحدد المفتاح';
  return q.type === 'tf' ? (Number(answer) ? 'خطأ' : 'صح') : (q.options?.[Number(answer)] || letters[Number(answer)] || '—');
}

function renderLargeResultPanels(r, p) {
  const e = resultExam(r); if (!e) return;
  const info = document.querySelector('#result-preview-info');
  if (info) info.innerHTML = `<strong class="result-preview-name">${esc(r.name || 'غير محدد')}</strong>${essayMaximum(e) ? `<span class="result-preview-score-chip"><small>درجة المقالي</small><b>${ar(r.essay?.[-1] ?? Object.entries(r.essay || {}).filter(([k])=>k!=='-1').reduce((sum,[,v])=>sum+Number(v||0),0))} / ${ar(essayMaximum(e))}</b></span>` : ''}<span class="result-preview-score-chip"><small>الدرجة الكلية</small><b>${ar(score(r))} / ${ar(total(e))}</b></span>`;
}

function fitLargeResultImage(image) {
  const scroll = image?.closest('.large-result-scroll'), wrap = image?.parentElement;
  if (!scroll || !wrap || !image.naturalWidth || !image.naturalHeight) return;
  // Fit to the viewer width while keeping the paper's natural proportions.
  // Tall sheets remain at a readable size and scroll inside this viewer.
  const maxWidth = scroll.clientWidth - 18;
  // A dialog can report zero width during its first paint (notably on Safari).
  // Do not collapse the paper to a 1px strip; wait for ResizeObserver instead.
  if (maxWidth < 120) return false;
  const scale = Math.min(maxWidth / image.naturalWidth, 1);
  const width = Math.max(1, Math.floor(image.naturalWidth * scale));
  const height = Math.max(1, Math.floor(image.naturalHeight * scale));
  wrap.style.display = 'block';
  wrap.style.width = `${width}px`;
  wrap.style.height = `${height}px`;
  image.style.width = `${width}px`;
  image.style.height = `${height}px`;
  scroll.scrollTop = 0;
  return true;
}

function layoutLargeResultImage(image, overlay, placeholder, r, p) {
  if (!image?.naturalWidth) return false;
  if (!fitLargeResultImage(image)) {
    image.hidden = true;
    if (overlay) overlay.hidden = true;
    if (placeholder) { placeholder.textContent = 'جارٍ تجهيز معاينة الورقة…'; placeholder.hidden = false; }
    return false;
  }
  image.hidden = false;
  if (overlay) overlay.hidden = false;
  if (placeholder) placeholder.hidden = true;
  requestAnimationFrame(() => drawResultOverlay(r, p, image, overlay));
  return true;
}

async function openLargeResultPreview(id, p) {
  const r = db.results.find(x => x.id === id); if (!r) return;
  largeResultPreview = { id, p };
  const e = resultExam(r), pageKeys = Object.keys(r.pages || {});
  if (!r.pages?.[p]) p = Number(pageKeys[0] || 0);
  largeResultPreview.p = p;
  modal('معاينة ورقة الطالب', `<div class="result-preview-toolbar"><button type="button" class="btn light small" onclick="navigateLargeResultPreview('previous')">→ السابق</button><div class="result-preview-top-info"><div id="result-preview-info"></div><small>${esc(e?.title || 'الاختبار')}</small></div><button type="button" class="btn gold small" onclick="navigateLargeResultPreview('next')">التالي ←</button></div>${resultPageButtons(r, p, true)}<div class="result-preview-grid"><section class="result-preview-paper"><div class="large-result-scroll"><div class="result-page-image-wrap"><div id="large-result-placeholder" class="result-preview-placeholder">جارٍ تحميل صورة الورقة...</div><img id="large-result-image" class="scan-preview" alt="معاينة ورقة الطالب" hidden><canvas id="large-result-overlay" aria-label="اضغط فقاعة لتعديل الإجابة" hidden></canvas></div></div><p class="note">الإجابة الخاطئة تظهر بالأحمر، وإجابة المعلم الصحيحة تظهر بالأصفر. اضغط أي فقاعة أو درجة المقالي لتعديلها؛ تُحدّث الدرجة أعلاه فورًا.</p></section></div>`);
  $('#modal').classList.add('result-preview-modal');
  renderLargeResultPanels(r, p);
  try {
    let url; try { url = await fileGet(r.pages[p]); } catch {}
    const originalImage = document.querySelector('#result-image');
    if (!url && originalImage?.complete && originalImage.naturalWidth) url = originalImage.currentSrc || originalImage.src;
    const image = document.querySelector('#large-result-image'), overlay = document.querySelector('#large-result-overlay'), placeholder = document.querySelector('#large-result-placeholder');
    const showMissing = message => { if (placeholder) { placeholder.textContent = message; placeholder.hidden = false; } if (image) image.hidden = true; if (overlay) overlay.hidden = true; };
    if (!url || !image || !overlay) { showMissing('لا توجد صورة محفوظة لهذه الورقة. أعد رفع الورقة من قسم التصحيح.'); return; }
    largeResultResizeObserver?.disconnect();
    const scroll = image.closest('.large-result-scroll');
    if (scroll && 'ResizeObserver' in window) {
      largeResultResizeObserver = new ResizeObserver(() => layoutLargeResultImage(image, overlay, placeholder, r, p));
      largeResultResizeObserver.observe(scroll);
    }
    image.onload = () => {
      // The image may load before the dialog's first layout. Retry briefly as
      // a fallback and let ResizeObserver finish once the viewer has a width.
      let attempts = 0;
      const retryLayout = () => {
        if (layoutLargeResultImage(image, overlay, placeholder, r, p) || attempts++ >= 12) return;
        requestAnimationFrame(retryLayout);
      };
      requestAnimationFrame(retryLayout);
    };
    image.onerror = () => showMissing('تعذر تحميل الصورة. أعد رفع الورقة من قسم التصحيح.');
    image.src = url;
    if (image.complete) {
      if (image.naturalWidth) layoutLargeResultImage(image, overlay, placeholder, r, p);
      else showMissing('تعذر تحميل الصورة. أعد رفع الورقة من قسم التصحيح.');
    }
  } catch { const placeholder = document.querySelector('#large-result-placeholder'); if (placeholder) { placeholder.textContent = 'تعذر استرجاع الصورة من هذا الجهاز. أعد رفع الورقة من قسم التصحيح.'; placeholder.hidden = false; } toast('تعذر استرجاع صورة الورقة'); }
}

async function switchLargeResultPage(id, p) {
  const r = db.results.find(x => x.id === id);
  if (!r?.pages?.[p]) return;
  largeResultPreview = { id, p };
  const nav = document.querySelector('.large-result-page-nav');
  if (nav) nav.outerHTML = resultPageButtons(r, p, true);
  renderLargeResultPanels(r, p);
  const image = document.querySelector('#large-result-image');
  const overlay = document.querySelector('#large-result-overlay');
  const placeholder = document.querySelector('#large-result-placeholder');
  if (!image || !overlay || !placeholder) return;
  image.hidden = true; overlay.hidden = true;
  placeholder.textContent = 'جارٍ تحميل صورة الصفحة...'; placeholder.hidden = false;
  try {
    const url = await fileGet(r.pages[p]);
    if (largeResultPreview?.id !== id || Number(largeResultPreview?.p) !== Number(p)) return;
    if (!url) throw new Error('missing page image');
    largeResultResizeObserver?.disconnect();
    const scroll = image.closest('.large-result-scroll');
    if (scroll && 'ResizeObserver' in window) {
      largeResultResizeObserver = new ResizeObserver(() => layoutLargeResultImage(image, overlay, placeholder, r, p));
      largeResultResizeObserver.observe(scroll);
    }
    image.onload = () => {
      let attempts = 0;
      const retryLayout = () => {
        if (largeResultPreview?.id !== id || Number(largeResultPreview?.p) !== Number(p)) return;
        if (layoutLargeResultImage(image, overlay, placeholder, r, p) || attempts++ >= 12) return;
        requestAnimationFrame(retryLayout);
      };
      requestAnimationFrame(retryLayout);
    };
    image.onerror = () => { placeholder.textContent = 'تعذر تحميل صورة الصفحة.'; placeholder.hidden = false; };
    image.src = url;
    if (image.complete && image.naturalWidth) layoutLargeResultImage(image, overlay, placeholder, r, p);
  } catch {
    if (largeResultPreview?.id === id && Number(largeResultPreview?.p) === Number(p)) {
      placeholder.textContent = 'تعذر استرجاع صورة الصفحة من هذا الجهاز.';
      placeholder.hidden = false;
    }
  }
}

async function navigateLargeResultPreview(direction) {
  const current = db.results.find(x => x.id === largeResultPreview?.id); if (!current) return;
  const sameExam = db.results.filter(x => x.exam === current.exam).slice().sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')));
  if (sameExam.length < 2) return toast('لا توجد أوراق أخرى لهذا الاختبار');
  const at = sameExam.findIndex(x => x.id === current.id), step = direction === 'previous' ? -1 : 1;
  const next = sameExam[(at + step + sameExam.length) % sameExam.length], oldPage = largeResultPreview.p;
  const page = next.pages?.[oldPage] ? oldPage : Number(Object.keys(next.pages || {})[0] || 0);
  closeModal();
  await reviewResult(next.id, page);
  await openLargeResultPreview(next.id, page);
}

function nextResultPaper(id) {
  const current = db.results.find(x => x.id === id); if (!current) return;
  const sameExam = db.results.filter(x => x.exam === current.exam).slice().sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')));
  if (sameExam.length < 2) return toast('لا توجد ورقة طالب تالية لهذا الاختبار');
  const index = sameExam.findIndex(x => x.id === id), next = sameExam[(index + 1) % sameExam.length];
  reviewResult(next.id);
}

function previousResultPaper(id) {
  const current = db.results.find(x => x.id === id); if (!current) return;
  const sameExam = db.results.filter(x => x.exam === current.exam).slice().sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')));
  if (sameExam.length < 2) return toast('لا توجد ورقة طالب سابقة لهذا الاختبار');
  const index = sameExam.findIndex(x => x.id === id), previous = sameExam[(index - 1 + sameExam.length) % sameExam.length];
  reviewResult(previous.id);
}

function assignBatchStudent(id, studentId) {
  const r = db.results.find(x => x.id === id), st = db.students.find(x => x.id === studentId);
  if (!r || !st) return;
  r.student = st.id; r.name = st.name; r.number = st.number; r.group = st.group; r.updated = new Date().toISOString(); save(); reviewResult(id);
  toast('تم ربط الورقة بالطالب وحفظها');
}

const originalLoadScans = loadScans;
loadScans = async function (files) { bulkWaiting = true; bulkReviewActive = false; return originalLoadScans(files); };

$('#modal')?.addEventListener('close', () => {
  largeResultResizeObserver?.disconnect();
  largeResultResizeObserver = null;
  $('#modal')?.classList.remove('result-preview-modal');
  largeResultPreview = null;
});
