const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
class Canvas{constructor(w=1123,h=794){this.width=w;this.height=h}getContext(){const self=this;return{drawImage(c){if(c.width===self.width&&c.height===self.height){self.data=c.data;return}self.data=new Uint8ClampedArray(self.width*self.height*4);for(let y=0;y<self.height;y++)for(let x=0;x<self.width;x++){const a=(Math.min(c.height-1,Math.floor(y*c.height/self.height))*c.width+Math.min(c.width-1,Math.floor(x*c.width/self.width)))*4,b=(y*self.width+x)*4;self.data.set(c.data.subarray(a,a+4),b)}},getImageData(){return{data:self.data}}}}}
const fake={innerHTML:'',style:{},offsetWidth:1,checked:true,open:true,classList:{add(){},remove(){}},textContent:'',addEventListener(){}};
const ctx={console,crypto:require('crypto').webcrypto,localStorage:{getItem(){return null},setItem(){}},indexedDB:{open(){return{}}},document:{querySelector(){return fake},createElement(){return new Canvas()}},window:{addEventListener(){}},navigator:{},location:{hash:''},setTimeout(){return 1},clearTimeout(){},Uint8Array,Math,Date,Number,JSON,Promise,confirm(){return true}};vm.createContext(ctx);for(const f of ['layout.js','voice.js','app.js','camera.js','scan-precision.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',f),'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),copy=s=>JSON.parse(run(`JSON.stringify(${s})`));
run(`const sample={id:'exam',title:'تجربة',questions:[...Array.from({length:15},(_,i)=>({id:'m'+i,type:'mcq',text:'سؤال',options:['أ','ب','ج','د'],answer:0,points:1})),...Array.from({length:15},(_,i)=>({id:'t'+i,type:'tf',text:'عبارة',options:['صح','خطأ'],answer:0,points:1})),{id:'essay',type:'essay',text:'وضح',options:[],points:15}]};db.exams=[sample];currentExam='exam'`);


ctx.fake=fake;
vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/results-workflow.js'),'utf8'),ctx);
run(`db.students=[{id:'student',name:'طالب تجريبي',number:'001234'}];db.results=[];scanState={exam:'exam',student:'student',version:8,p:0,answers:{0:0,1:1,2:null},essay:{[-1]:6},flags:{2:'تظليل متعدد'},readings:{2:[.8,.8,0,0]}}`);
assert.equal(run('score(scanPreviewModel().draft)'),7);
assert.equal(run('db.results.length'),0,'preview must not create a saved result');
assert.equal(run('scanPreviewModel().draft.markings[0][2].status'),'double');
run(`const image={clientWidth:1123,clientHeight:794};const pen={beginPath(){},arc(){},stroke(){}};const canvas={getContext(){return pen},getBoundingClientRect(){return{left:0,top:0}}};document.querySelector=s=>s==='#large-scan-image'?image:s==='#large-scan-overlay'?canvas:s==='#scan-preview-info'?null:fake;scanState.canvas={width:1123,height:794};scanState.corners=paperGeometry(8).markers.map(([x,y])=>({x,y}));scanPreviewSession={scan:scanState};renderScan=()=>{};toast=()=>{};const point=scanPlan(scanState,sample).items.find(v=>v.i===1).bubbles.find(b=>b.value===0);editScanPreviewPoint({clientX:point.x,clientY:point.y})`);
assert.equal(run('scanState.answers[1]'),0);
assert.equal(run('score(scanPreviewModel().draft)'),8);
assert.equal(run('db.results.length'),0,'editing a preview must remain a draft');
run(`let writtenImage=null;filePut=async(k,v)=>{writtenImage={k,v}};save=()=>{};results=()=>{};scanState.url='synthetic-sheet';scanQueue=[{}];scanIndex=0;`);
(async()=>{await run('saveScan(true)');assert.equal(run('db.results.length'),1);assert.equal(run('db.results[0].answers[1]'),0);assert.equal(run('db.results[0].essay[-1]'),6);assert.equal(run('writtenImage.v'),'synthetic-sheet');assert.equal(run('score(db.results[0])'),8);console.log('PASS: colored draft preview preserves double marks, updates answers without saving, and saves the corrected result and essay through the normal review flow.');})().catch(e=>{console.error(e);process.exitCode=1});
