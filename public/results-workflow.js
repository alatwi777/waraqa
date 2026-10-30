/* Bulk grading and direct-on-paper answer editing. Loaded after app.js. */
let bulkWaiting = false;
let bulkReviewActive = false;
let batchProcessing = false;
let batchRunId = '';
let resultHitContext = null;
let largeResultPreview = null;

const originalOpenScan = openScan;
const originalRenderScan = renderScan;
const originalResults = results;
const originalReviewResult = reviewResult;
const originalDrawResultOverlay = drawResultOverlay;

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
  let r = db.results.find(x => x.exam === e.id && x.student === st.id);
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

results = function () {
  if (currentResult && db.results.some(r => r.id === currentResult)) return reviewResult(currentResult);
  const pendingList = bulkWaiting && scanQueue.length ? `<div class="bulk-file-list" aria-label="الأوراق المضافة">${scanQueue.map((f,i)=>`<span><b>${ar(i+1)}</b> ${esc(f.name)} <small>بانتظار التصحيح</small></span>`).join('')}</div>` : '';
  const base = `<section class="panel bulk-batch-panel"><div><strong>دفعة أوراق التصحيح</strong><p class="note">${bulkWaiting && scanQueue.length ? `${ar(scanQueue.length)} ورقة أُضيفت إلى النتائج، جاهزة للمعالجة.` : 'ارفع مجموعة صور أو ملف PDF من قسم التصحيح لتجهيز دفعة.'}</p></div><div class="actions">${bulkWaiting && scanQueue.length ? `<button class="btn gold" onclick="correctAllPending()" ${batchProcessing ? 'disabled' : ''}>${batchProcessing ? 'جارٍ التصحيح…' : 'تصحيح الكل'}</button><button class="btn light" onclick="startBatchReview()">مراجعة الأوراق يدويًا</button><button class="btn light small" onclick="cancelPendingBatch()">إلغاء الدفعة</button>` : `<a class="btn light" href="#scan">اختيار أوراق للتصحيح</a>`}</div>${pendingList}<p id="batch-progress" class="note" aria-live="polite"></p></section>`;
  const rows = db.results.slice().reverse().map(r => {
    const e = resultExam(r), complete = Object.keys(r.pages || {}).length >= resultPageCount(r), c = issueCounts(r);
    return `<tr><td><strong>${esc(r.number || '—')}</strong></td><td><span class="avatar">${esc((r.name || '?')[0])}</span>${esc(r.name || 'طالب غير معروف')}</td><td>${esc(e?.title || 'اختبار محذوف')}</td><td><strong>${ar(score(r))}</strong> / ${ar(e ? total(e) : 0)}</td><td><span class="tag ${complete ? '' : 'amber'}">${r.batchAuto ? 'تصحيح آلي — راجع الحالات' : complete ? 'راجَعها المعلم' : 'صفحات ناقصة'}</span><div class="issue-counts">${[['double','مزدوج'],['blank','متروك'],['wrong','خاطئ']].map(([k,n]) => `<button class="issue-chip ${k}" onclick="openResultIssue('${r.id}','${k}')">${n} ${ar(c[k])}</button>`).join('')}<span class="issue-chip">مقالي للمراجعة ${ar(c.essayPending)}</span></div></td><td><button class="text-link" onclick="reviewResult('${r.id}')">معاينة وتعديل ←</button> <button class="delete-link" type="button" onclick="deleteResult('${r.id}')">حذف</button></td></tr>`;
  }).join('');
  $('#app').innerHTML = head('النتائج والتقارير', 'الورقة الأصلية، الإجابات، والدرجة. كل شيء قابل للمراجعة.', btn('↓ تصدير CSV','exportResults()','light')) + base + `<section class="panel"><div class="table-wrap"><table><thead><tr><th>رقم الطالب</th><th>الطالب</th><th>الاختبار</th><th>الدرجة</th><th>الحالة والإجابات</th><th>الورقة</th></tr></thead><tbody>${rows}</tbody></table></div>${!db.results.length ? empty('نتائج تستحق الاحتفاء','ابدأ برفع أول ورقة في قسم التصحيح.',`<a class="btn light small" href="#scan">الانتقال للتصحيح</a>`) : ''}</section>`;
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
      const plan = scanPlan(s, e), page = Number(s.p || 0), id = uid(), pageKey = id + '-' + page + '-' + uid();
      await filePut(pageKey, s.url);
      const r = { id, exam: e.id, student: student?.id || '', name: student?.name || `طالب غير معروف — ${s.name}`, number: student?.number || '', group: student?.group || '', snapshot: { ...JSON.parse(JSON.stringify(e)), paperVersion: s.version || 8 }, answers: {}, essay: {}, pages: { [page]: pageKey }, reviewed: {}, markings: { [page]: {} }, date: new Date().toISOString(), updated: new Date().toISOString(), batchAuto: true, batchRunId };
      for (const { i, q } of plan.items) {
        r.answers[i] = s.answers[i] ?? null;
        r.essay[i] = q.type === 'essay' ? (i === -1 ? (s.essay?.[-1] ?? null) : (s.essay?.[i] ?? null)) : 0;
        r.reviewed[i] = true;
        if (q.type !== 'essay') { const status = scanAnswerStatus(q, i, s); r.markings[page][i] = { status, marked: scanMarkedValues(i, s, status) }; }
      }
      db.results.push(r); save(); done++;
    } catch (err) { failed.push(scanQueue[scanIndex]?.name || `ورقة ${scanIndex + 1}`); }
    if (progress) progress.textContent = `تم تصحيح ${ar(done)} من ${ar(scanQueue.length)}${failed.length ? ` · تعذر فتح ${ar(failed.length)} ورقة` : ''}`;
  }
  batchProcessing = false; bulkWaiting = false; scanQueue = []; scanState = null; scanIndex = 0; save(); results();
  toast(`اكتمل التصحيح الآلي: ${ar(done)} ورقة${failed.length ? `، وتعذر معالجة ${ar(failed.length)}` : ''}`);
}

function openResultIssue(id, kind) { currentResult = id; reviewResult(id).then(() => { const r = db.results.find(x => x.id === id), e = resultExam(r); const q = e.questions.findIndex((x, i) => x.type !== 'essay' && resultAnswerStatus(r, x, i, Number(Object.keys(r.pages)[0] || 0)) === kind); if (q >= 0) setTimeout(() => document.querySelector(`#result-q-${q}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); }); }

reviewResult = async function (id, p = 0) {
  await originalReviewResult(id, p);
  const r = db.results.find(x => x.id === id); if (!r) return;
  const imagePanel = document.querySelector('.review-layout > section:first-child');
  if (imagePanel && !imagePanel.querySelector('.result-edit-hint')) imagePanel.insertAdjacentHTML('beforeend', '<p class="note result-edit-hint">اضغط فقاعة الإجابة لتعديلها، أو فقاعة مجموع المقالي أعلى الورقة لرصد الدرجة. النقر على الفقاعة المحددة يمسحها.</p>');
  const imageToolbar = imagePanel?.querySelector('.toolbar');
  if (imageToolbar && !imageToolbar.querySelector('.result-paper-actions')) imageToolbar.insertAdjacentHTML('beforeend', `<div class="result-paper-actions"><button type="button" class="btn light small" onclick="previousResultPaper('${r.id}')">→ السابق</button><button type="button" class="btn gold small next-result-paper" onclick="nextResultPaper('${r.id}')">التالي ←</button><button type="button" class="btn light small" onclick="openLargeResultPreview('${r.id}',${p})">معاينة أكبر</button></div>`);
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
    if (image?.complete && image.naturalWidth && overlay) drawResultOverlay(r, p, image, overlay);
  });
}

async function openLargeResultPreview(id, p) {
  const r = db.results.find(x => x.id === id); if (!r) return;
  largeResultPreview = { id, p };
  modal('معاينة أكبر — ' + (r.name || 'ورقة الطالب'), `<div class="large-result-scroll"><div class="result-page-image-wrap"><img id="large-result-image" class="scan-preview" alt="معاينة مكبّرة لورقة الطالب"><canvas id="large-result-overlay" aria-label="اضغط فقاعة لتعديل الإجابة"></canvas></div></div><p class="note">اضغط فقاعة الإجابة أو درجة المقالي على الصورة لتعديلها مباشرة. تُحفظ التغييرات فورًا.</p>`);
  $('#modal').classList.add('result-preview-modal');
  try {
    const url = await fileGet(r.pages[p]), image = document.querySelector('#large-result-image'), overlay = document.querySelector('#large-result-overlay');
    if (!url || !image || !overlay) return toast('تعذر فتح صورة الورقة');
    image.onload = () => drawResultOverlay(r, p, image, overlay);
    image.src = url;
    if (image.complete) drawResultOverlay(r, p, image, overlay);
  } catch { toast('تعذر استرجاع صورة الورقة'); }
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
  $('#modal')?.classList.remove('result-preview-modal');
  largeResultPreview = null;
});
