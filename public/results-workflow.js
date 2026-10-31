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
  if (plan.items.some(v => v.q.type === 'essay' && (s.essay[v.i] === null || s.essay[v.i] === undefined || !Number.isFinite(s.essay[v.i]) || s.essay[v.i] < 0 || s.essay[v.i] > v.q.points))) return toast('حدّد درجة المقالي المطلوبة قبل الحفظ. استخدم ٠ لل�