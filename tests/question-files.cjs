'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Q=require('../public/question-files.js');
const stem='أي مصدر مائي تجمعت مياهه في باطن الأرض منذ العصور الجيولوجية القديمة؟ '.repeat(2);
const option='المياه الجوفية العميقة المخزنة في باطن الأرض منذ آلاف السنين';
const question=key=>`اختياري 01: ${stem}\nأ: ${option}\nب: المياه السطحية\nج: مياه الأمطار\nد: مياه الصرف المعالجة\n${key}`;
for(const key of ['الإجابة الصحيحة: أ الدرجة: ١','الإجابة الصحيحة: أ: الدرجة: 1','الإجابة الصحيحة أ الدرجة: 1','الإجابة الصحيحة： أ： الدرجة： 1']){
 const parsed=Q.parse(question(key));assert.deepEqual(parsed.errors,[],key);assert.equal(parsed.questions[0].answer,0,key);assert.equal(parsed.questions[0].points,1);assert.equal(parsed.questions[0].text,stem.trim());assert.equal(parsed.questions[0].options[0],option);
 const normalized=Q.normalizeAnswerLines(question(key));assert.match(normalized,/الإجابة الصحيحة: أ: الدرجة: 1/);assert.equal(Q.parse(normalized).questions[0].answer,0);
}
const tf=Q.parse('صح وخطأ 01: موارد المياه مهمة للحياة.\nالإجابة الصحيحة: خطأ الدرجة: ٢');assert.equal(tf.questions[0].answer,1);assert.equal(tf.questions[0].points,2);
assert.match(Q.parse(question('الإجابة الصحيحة: هـ الدرجة: 1')).errors.join(' '),/مفتاح الإجابة/);
assert.equal(Q.parse(question('الإجابة الصحيحة: .... الدرجة: 1')).questions[0].answer,null);
assert.match(Q.parse('اختياري 01: سؤال\nأ: فقط').errors.join(' '),/غير مكتمل/);
const app=fs.readFileSync(require.resolve('../public/app.js'),'utf8');assert.ok(!app.includes('maxlength="24"'));assert.ok(!app.includes('maxlength="80"'));
console.log('PASS: answer keys with/without colon before grades; Arabic numerals; long questions/options preserved; missing and invalid options still checked.');
