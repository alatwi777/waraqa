'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm'),parserContext={module:{exports:{}}};vm.createContext(parserContext);vm.runInContext(fs.readFileSync(require.resolve('../public/question-files.js'),'utf8'),parserContext);
const Q={parse:text=>JSON.parse(JSON.stringify(parserContext.module.exports.parse(text))),normalizeAnswerLines:parserContext.module.exports.normalizeAnswerLines};
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
// Regression: PDF extraction includes a vertical separator and a duplicated alef
// from the Arabic lam-alef glyph. Neither may be printed as option text.
for(const label of ['الإجابة','اإلجابة','اﻹجابة']){
 const source=question(`${label} الصحيحة: أ | الدرجة: 1`);
 const direct=Q.parse(source),normalized=Q.parse(Q.normalizeAnswerLines(source));
 for(const parsed of [direct,normalized]){assert.deepEqual(parsed.errors,[]);assert.equal(parsed.questions[0].answer,0);assert.equal(parsed.questions[0].options[3],'مياه الصرف المعالجة');}
}
const joined=question('الإجابة الصحيحة: أ | الدرجة: 1').replace('د: مياه الصرف المعالجة\n','د: مياه الصرف المعالجة ');
const split=joined.replace('الإجابة الصحيحة','الإجابة\nالصحيحة');
for(const source of [joined,split]){for(const text of [source,Q.normalizeAnswerLines(source)]){const p=Q.parse(text);assert.deepEqual(p.errors,[]);assert.equal(p.questions[0].answer,0);assert.equal(p.questions[0].options[3],'مياه الصرف المعالجة');}}
const twoPages=question('اإلجابة الصحيحة: أ | الدرجة: 1')+'\nالوحدة الثانية: موارد المملكة العربية السعودية | صفحة 1 من 3\nالدراسات الاجتماعية - الصف الثالث المتوسط\nالوحدة الثانية: موارد المملكة العربية السعودية\nصح وخطأ 01: المياه مهمة. اإلجابة الصحيحة: صح | الدرجة: 1';
const cleaned=Q.parse(twoPages);assert.deepEqual(cleaned.errors,[]);assert.equal(cleaned.questions.length,2);assert.equal(cleaned.questions[1].text,'المياه مهمة.');assert.equal(cleaned.questions[1].answer,0);assert.ok(!JSON.stringify(cleaned.questions).includes('الإجابة'));assert.ok(!JSON.stringify(cleaned.questions).includes('صفحة 1'));
console.log('PASS: joined/split PDF answer labels, lam-alef variants, vertical separators and page headers never leak into printable questions/options.');
const context={module:{exports:{}},console};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../public/question-files.js'),'utf8'),context);
const dirty={id:'keep-id',type:'mcq',text:'سؤال؟',options:['أول','ثاني','ثالث','رابع اإلجابة الصحيحة: ب | الدرجة: 1 الوحدة الثانية: موارد المملكة | صفحة 1 من 3'],answer:null,points:3};
context.dirty=dirty;const repaired=vm.runInContext('cleanImportedQuestionMetadata(dirty)',context);assert.equal(repaired.id,'keep-id');assert.equal(repaired.points,3);assert.equal(repaired.answer,1);assert.equal(repaired.options[3],'رابع');assert.equal(dirty.options[3].includes('الصحيحة'),true);context.dirty={...dirty,answer:2};assert.equal(vm.runInContext('cleanImportedQuestionMetadata(dirty)',context).answer,2);
context.dirty={...dirty,options:['أول','ثاني','ثالث','رابع']};assert.equal(vm.runInContext('cleanImportedQuestionMetadata(dirty)',context),null);
console.log('PASS: existing imported questions repaired while preserving IDs, custom points and teacher-selected keys.');
