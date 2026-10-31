/* Prepare Noor's official grade-import CSV from a local spreadsheet and template. */
'use strict';
let noorGradeState = null;

function noorGradeExportModal() {
  noorGradeState = { sourceRows: null, sourceWorkbook: null, sourceSheet: '', sourceName: '', sourceHeader: 0, sourceId: -1, sourceGrade: -1, templateRows: null, templateName: '', templateHeader: 0, templateId: -1, templateGrade: -1, templateDelimiter: ',', templatePrefix: '' };
  modal('تجهيز ملف درجات نور', `<div class="noor-grade" id="noor-grade-content">${noorGradeBody()}</div>`);
}

function noorGradeBody() {
  const s = noorGradeState;
  if (!s) return '';
  const sourceReady = !!s.sourceRows, templateReady = !!s.templateRows;
  return `<p class="note noor-grade-intro">ارفع ملف درجات Excel، ثم ارفع نموذج التصحيح الإلكتروني CSV الذي نزّلته من نور. اختر أعمدة رقم الطالب والدرجة؛ ستتم مطابقة الأرقام محليًا داخل هذا المتصفح، ثم تُنزّل نسخة من نموذج نور بعد تعبئة الدرجات المطابقة.</p>
    <div class="noor-grade-files">
      <label class="noor-grade-file"><strong>١. ملف الدرجات</strong><span>${sourceReady ? esc(s.sourceName) : 'Excel أو CSV يحتوي رقم الطالب والدرجة'}</span><input type="file" accept=".xlsx,.xls,.csv,.tsv,.txt,.numbers" onchange="noorReadSource(this.files[0])"></label>
      <label class="noor-grade-file"><strong>٢. نموذج نور</strong><span>${templateReady ? esc(s.templateName) : 'ملف Template.csv الذي تم تنزيله من نور'}</span><input type="file" accept=".csv,.txt" onchange="noorReadTemplate(this.files[0])"></label>
    </div>
    ${sourceReady ? noorSourceControls() : ''}${templateReady ? noorTemplateControls() : ''}
    ${sourceReady && templateReady ? noorGradePreview() : `<div class="noor-grade-help"><b>طريقة الاستخدام</b><ol><li>من نور نزّل نموذج التصحيح الإلكتروني للفصل أو الاختبار المطلوب.</li><li>حدّد ملف الدرجات وعمود رقم السجل وعمود الدرجة.</li><li>راجع المطابقة، ثم نزّل الملف وارفعه في صفحة نور نفسها.</li></ol><small>لا تسجّل الأداة الدخول إلى نور ولا ترسل درجات تلقائيًا. لن يتغير ملفك الأصلي.</small></div>`}`;
}

function noorUpdateBody() {
  const el = document.querySelector('#noor-grade-content');
  if (el) el.innerHTML = noorGradeBody();
}

function noorDigits(value) {
  return String(value ?? '').normalize('NFKC').replace(/[٠-٩۰-۹]/g, c => String(c.charCodeAt(0) >= 1776 ? c.charCodeAt(0) - 1776 : c.charCodeAt(0) - 1632)).replace(/\D/g, '');
}

function noorHeaderKind(value) {
  const h = String(value ?? '').toLowerCase().replace(/[\u064B-\u065F\u0670ـ\s_\-:]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  if (['رقمالطالب','رقمالطالبه','رقمالسجل','السجلالمدني','رقمالهويه','رقمالهوية','رقمالطالبالمدرسي','studentid','studentnumber','recordnumber','id'].includes(h)) return 'id';
  if (['الدرجه','درجه','الدرجهالكلية','الدرجهالكليه','المجموع','المجموعالكلي','الدرجة','score','grade','mark','marks','total'].includes(h) || h.includes('درج') || h.includes('grade') || h.includes('score')) return 'grade';
  return '';
}

function noorHeaderRow(rows, preferred) {
  let best = Number.isInteger(preferred) ? preferred : 0, score = -1;
  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const kinds = new Set((rows[r] || []).map(noorHeaderKind).filter(Boolean));
    const n = (kinds.has('id') ? 2 : 0) + (kinds.has('grade') ? 1 : 0);
    if (n > score) { score = n; best = r; }
  }
  return Math.max(0, best);
}

function noorGuessColumn(rows, header, kind) {
  const row = rows[header] || [];
  const found = row.findIndex(x => noorHeaderKind(x) === kind);
  if (found >= 0) return found;
  if (kind === 'grade') {
    const any = row.findIndex(x => /درج|مجموع|score|grade|mark/i.test(String(x)));
    if (any >= 0) return any;
  }
  if (kind === 'id') {
    for (let c = 0; c < Math.max(0, ...rows.slice(header + 1, header + 9).map(x => x.length)); c++) {
      const sample = rows.slice(header + 1, header + 9).map(x => noorDigits(x[c])).filter(Boolean);
      if (sample.length >= 2 && sample.every(x => x.length >= 5 && x.length <= 20)) return c;
    }
  }
  return -1;
}

function noorColOptions(rows, selected, header, emptyLabel) {
  const width = Math.max(rows[header]?.length || 0, ...rows.slice(header + 1, header + 4).map(r => r.length));
  const items = Array.from({ length: width }, (_, i) => {
    const label = String(rows[header]?.[i] || `عمود ${ar(i + 1)}`).trim().slice(0, 55);
    return [String(i), label 