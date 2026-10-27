const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
class Canvas{constructor(w=1123,h=794){this.width=w;this.height=h}getContext(){const self=this;return{drawImage(c){if(c.width===self.width&&c.height===self.height){self.data=c.data;return}self.data=new Uint8ClampedArray(self.width*self.height*4);for(let y=0;y<self.height;y++)for(let x=0;x<self.width;x++){const a=(Math.min(c.height-1,Math.floor(y*c.height/self.height))*c.width+Math.min(c.width-1,Math.floor(x*c.width/self.width)))*4,b=(y*self.width+x)*4;self.data.set(c.data.subarray(a,a+4),b)}},getImageData(){return{data:self.data}}}}}
const fake={innerHTML:'',style:{},offsetWidth:1,checked:true,open:true,classList:{add(){},remove(){}},textContent:'',addEventListener(){}};
const ctx={console,crypto:require('crypto').webcrypto,localStorage:{getItem(){return null},setItem(){}},indexedDB:{open(){return{}}},document:{querySelector(){return fake},createElement(){return new Canvas()}},window:{addEventListener(){}},navigator:{},location:{hash:''},setTimeout(){return 1},clearTimeout(){},Uint8Array,Math,Date,Number,JSON,Promise,confirm(){return true}};vm.createContext(ctx);for(const f of ['layout.js','voice.js','app.js','camera.js','scan-precision.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',f),'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),copy=s=>JSON.parse(run(`JSON.stringify(${s})`));
run(`const sample={id:'exam',title:'تجربة',questions:[...Array.from({length:15},(_,i)=>({id:'m'+i,type:'mcq',text:'سؤال',options:['أ','ب','ج','د'],answer:0,points:1})),...Array.from({length:15},(_,i)=>({id:'t'+i,type:'tf',text:'عبارة',options:['صح','خطأ'],answer:0,points:1})),{id:'essay',type:'essay',text:'وضح',options:[],points:15}]};db.exams=[sample];currentExam='exam'`);

assert.equal(run("normalizeStudentNumber('٠٠١٢ ٣٤')"),'001234');
ctx.roster=[{id:'a',number:'001234'},{id:'b',number:'1234'}];
assert.equal(run("exactStudentMatch('001234',95,roster).id"),'a');
assert.equal(run("exactStudentMatch('001234',60,roster)"),null);
assert.equal(run("exactStudentMatch('001234 1234',95,roster)"),null);
assert.equal(run("exactStudentMatch('991234',99,roster)"),null);
assert.equal(run("studentFromReadings({text:'001234',confidence:76},{text:'001234',confidence:86},roster).id"),'a');
assert.equal(run("studentFromReadings({text:'001234',confidence:74},{text:'001234',confidence:74},roster)"),null);
assert.equal(run("studentFromReadings({text:'001234',confidence:95},{text:'1234',confidence:95},roster)"),null);
ctx.roster.push({id:'duplicate',number:'001234'});assert.equal(run("exactStudentMatch('001234',95,roster)"),null);
// A bowed sheet with independently shifted rows, including the one aggregate essay row.
const g=copy('paperGeometry(8)'),c=new Canvas(g.width,g.height);c.data=new Uint8ClampedArray(c.width*c.height*4).fill(255);
const put=(x,y,v)=>{const n=(Math.round(y)*c.width+Math.round(x))*4;if(n<0||n>=c.data.length)return;c.data[n]=c.data[n+1]=c.data[n+2]=v};
const plan=copy('scanPlan({version:8,p:0},sample)'),shifts={};
for(const v of plan.items){const dx=v.q.type==='essay'?0:5,dy=v.q.type==='essay'?-11:7;shifts[v.i]={dx,dy};for(const b of v.bubbles)for(let xx=-b.r-1;xx<=b.r+1;xx++)for(let yy=-b.r-1;yy<=b.r+1;yy++){if(Math.abs(Math.hypot(xx,yy)-b.r)<.7)put(b.x+dx+xx,b.y+dy+yy,20);if(b.value===(v.i===-1?6:0)&&Math.hypot(xx,yy)<b.r*.78)put(b.x+dx+xx,b.y+dy+yy,20)}}
ctx.testCanvas=c;run('scanState={canvas:testCanvas,version:8,p:0,corners:paperGeometry(8).markers.map(([x,y])=>({x,y})),answers:{},essay:{}};detectAndRead()');
assert.equal(run('scanState.answers[0]'),0);assert.equal(run('scanState.essay[-1]'),6);
const registration=copy('scanState.bubbleRegistration');assert(registration.reliable/registration.count>.95);
for(const v of plan.items)for(const b of v.bubbles){const o=registration.offsets[v.i+':'+b.value];assert(Math.hypot(o.dx-shifts[v.i].dx,o.dy-shifts[v.i].dy)<3,JSON.stringify({v:v.i,o,expected:shifts[v.i]}))}
console.log('PASS: bowed row/essay registration and OMR agree; student exact matching preserves leading zeros and rejects low-confidence, unknown, multiple or duplicate IDs.');
(async()=>{
 run(`let releaseIdentityRead;refreshIdentityUI=()=>{};getNumberOCR=async()=>({});recognizeNumber=()=>new Promise(resolve=>releaseIdentityRead=resolve);studentNumberCrop=()=>({});db.students=[{id:'auto',number:'001234'},{id:'manual',number:'009999'}];scanState={student:'',version:8};const pendingIdentity=identifyScanStudent(scanState,true);`);
 await Promise.resolve();await Promise.resolve();
 run(`scanState.student='manual';scanState.identityStatus='تم اختيار الطالب يدويًا';releaseIdentityRead({data:{text:'001234',confidence:99}})`);
 await run('pendingIdentity');assert.equal(run('scanState.student'),'manual');assert.equal(run('scanState.identityStatus'),'تم اختيار الطالب يدويًا');
 console.log('PASS: manual student correction remains authoritative during a pending automatic retry.');
})().catch(e=>{console.error(e);process.exitCode=1});
