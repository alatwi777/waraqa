const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
class Canvas{constructor(w=1123,h=794){this.width=w;this.height=h}getContext(){const self=this;return{drawImage(c){if(c.width===self.width&&c.height===self.height){self.data=c.data;return}self.data=new Uint8ClampedArray(self.width*self.height*4);for(let y=0;y<self.height;y++)for(let x=0;x<self.width;x++){const a=(Math.min(c.height-1,Math.floor(y*c.height/self.height))*c.width+Math.min(c.width-1,Math.floor(x*c.width/self.width)))*4,b=(y*self.width+x)*4;self.data.set(c.data.subarray(a,a+4),b)}},getImageData(){return{data:self.data}}}}}
const fake={innerHTML:'',style:{},offsetWidth:1,checked:true,open:true,classList:{add(){},remove(){}},textContent:'',addEventListener(){}};
const ctx={console,crypto:require('crypto').webcrypto,localStorage:{getItem(){return null},setItem(){}},indexedDB:{open(){return{}}},document:{querySelector(){return fake},createElement(){return new Canvas()}},window:{addEventListener(){}},navigator:{},location:{hash:''},setTimeout(){return 1},clearTimeout(){},Uint8Array,Math,Date,Number,JSON,Promise,confirm(){return true}};vm.createContext(ctx);for(const f of ['layout.js','voice.js','app.js','camera.js','scan-precision.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',f),'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),copy=s=>JSON.parse(run(`JSON.stringify(${s})`));
run(`const sample={id:'exam',title:'تجربة',questions:[...Array.from({length:15},(_,i)=>({id:'m'+i,type:'mcq',text:'سؤال',options:['أ','ب','ج','د'],answer:0,points:1})),...Array.from({length:15},(_,i)=>({id:'t'+i,type:'tf',text:'عبارة',options:['صح','خطأ'],answer:0,points:1})),{id:'essay',type:'essay',text:'وضح',options:[],points:15}]};db.exams=[sample];currentExam='exam'`);


run(`db.students=[{id:'student',number:'001234',name:'طالب تجريبي'}];updateScanSummary=()=>{};studentNumberCrop=()=>({});getNumberOCR=async()=>({});save=()=>{};let identityCalls=0;recognizeNumber=async()=>{identityCalls++;return{data:{text:'001234',confidence:identityCalls===1?92:77}}};scanState={student:'',version:8}`);
(async()=>{
 await Promise.all([run('identifyScanStudent(scanState)'),run('identifyScanStudent(scanState,true)')]);
 assert.equal(run('identityCalls'),2,'overlapping callers must share one two-reading recognition job');assert.equal(run('scanState.student'),'student');
 run(`scanState={student:'',version:8,savedResultId:'draft'};db.results=[{id:'draft',student:''}];recognizeNumber=async()=>({data:{text:'001234',confidence:95}})`);
 await run('identifyScanStudent(scanState)');assert.equal(run('db.results[0].student'),'student','finishing OCR after quick save must attach the same saved draft');
 run(`scanState={student:'',version:8};recognizeNumber=async()=>({data:{text:'001235',confidence:99}})`);
 await run('identifyScanStudent(scanState)');assert.equal(run('scanState.student'),'','unknown number must never fuzzy-match a student');
 run(`scanState={student:'',version:8};db.students.push({id:'duplicate',number:'001234'});recognizeNumber=async()=>({data:{text:'001234',confidence:99}})`);
 await run('identifyScanStudent(scanState)');assert.equal(run('scanState.student'),'','duplicate roster numbers must not be assigned automatically');
 const value=run(`numericOCRReading({text:'001234 :',confidence:30,blocks:[{paragraphs:[{lines:[{words:[{text:'001234',confidence:92},{text:':',confidence:87}]}]}]}]}).confidence`);assert.equal(value,92);
 console.log('PASS: shared OCR job; exact two-reading identity; late recognition attaches saved draft; unknown/duplicate numbers rejected; numeric word confidence independent of Arabic punctuation.');
})().catch(e=>{console.error(e);process.exitCode=1});
