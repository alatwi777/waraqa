const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('public/results-workflow.js','utf8');const code=source.match(/const gradingStageSize = \d+;/)[0]+'\n'+source.slice(source.indexOf('async function correctAllPending()'),source.indexOf('\nfunction openResultIssue(',source.indexOf('async function correctAllPending()')));
(async()=>{let active=0,peak=0,checkpoints=[],commits=[],messages=[];const e={id:'exam',questions:[{type:'mcq',answer:0}]};const items=Array.from({length:150},(_,i)=>({name:'sheet-'+i,index:i}));const sentinel={untouched:true};
const c=vm.createContext({AbortController,window:{WaraqaFirebaseUid:'owner'},db:{exams:[e],students:[],results:[]},flushLocalChanges:async()=>{checkpoints.push(commits.length);return true;},getExam:()=>e,scanQueue:items,scanState:sentinel,scanIndex:0,batchProcessing:false,bulkWaiting:true,bulkReviewActive:false,currentResult:null,resultsExamFilter:'',batchRunId:'',gradingProgress:null,document:{querySelector:()=>null},uid:()=> 'batch',results:()=>{},save:()=>true,toast:m=>messages.push(m),ar:String,prepareScanItem:async(item,exam,background)=>{if(item.index%15===0)assert.equal(checkpoints.length,1+item.index/15);assert.equal(background,true);assert.equal(exam.id,'exam');active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,item.index%2?1:15));active--;return{exam:'exam',index:item.index,p:0};},remoteReadScan:async(s)=>{if(s.index===3)throw Error('synthetic interruption');s.remoteReady=true;},identifyScanStudent:async()=>{},persistScanDraft:async(s)=>{assert.equal(s.remoteReady,true);commits.push(s.index);},setTimeout,console});
vm.runInContext(code,c);await c.correctAllPending();assert.equal(peak,2);assert.deepEqual(commits,items.map(x=>x.index).filter(i=>i!==3));assert.equal(checkpoints.length,11);assert.equal(c.scanState,null);assert.equal(c.batchProcessing,false);assert.match(messages.at(-1),/149/);assert.match(messages.at(-1),/1/);console.log('PASS: bounded two-page preparation, out-of-order completion commits in source order, isolated scan states and partial failure progress.');})().catch(e=>{console.error(e);process.exit(1)});
(async()=>{let started=0,committed=0,notice='';const e={id:'e',questions:[]},state={error:null},items=Array.from({length:7},(_,index)=>({index,name:'synthetic-'+index}));
 const c=vm.createContext({AbortController,LocalStore:state,window:{WaraqaFirebaseUid:'u'},db:{exams:[e],students:[],results:[]},getExam:()=>e,scanQueue:items,scanState:null,scanIndex:0,batchProcessing:false,bulkWaiting:true,bulkReviewActive:false,currentResult:null,resultsExamFilter:'',batchRunId:'',gradingProgress:null,document:{querySelector:()=>null},uid:()=> 'b',results:()=>{},save:()=>true,toast:()=>{},ar:String,flushLocalChanges:async()=>true,prepareScanItem:async item=>({index:item.index,p:0}),remoteReadScan:async s=>{started++;await new Promise(r=>setTimeout(r,s.index?1:15));if(s.index===1){s.storageFailure=true;throw Object.assign(Error('image storage full'),{name:'QuotaExceededError'});}s.remoteReady=true;},identifyScanStudent:async()=>{},persistScanDraft:async()=>committed++,remoteStatus:text=>notice=text,setTimeout});
 vm.runInContext(code,c);await c.correctAllPending();assert(started<=2);assert.equal(committed,0);assert.equal(c.scanQueue.length,7);assert.equal(c.bulkWaiting,true);assert.equal(c.batchProcessing,false);assert.match(notice,/الحفظ/);console.log('PASS: image quota failure stops after bounded in-flight work, preserves pending queue and clears misleading queue status.');
})().catch(e=>{console.error(e);process.exit(1)});

async function testCancel(authorized){
 const commits=[],toasts=[],started=[];
 const exam={id:'e',questions:[]};
 const items=Array.from({length:40},(_,index)=>({index}));
 const context=vm.createContext({
  AbortController,window:{WaraqaAuthorized:authorized,WaraqaFirebaseUid:'teacher'},
  scanQueue:items,scanIndex:0,batchProcessing:false,bulkWaiting:true,scanState:null,
  bulkReviewActive:false,currentResult:null,gradingProgress:null,batchRunId:'',resultsExamFilter:'',
  db:{exams:[exam],students:[],results:[]},document:{querySelector:()=>null},
  getExam:()=>exam,uid:()=> 'run',ar:String,confirm:()=>true,results:()=>{},remoteStatus:()=>{},
  flushLocalChanges:async()=>true,toast:m=>toasts.push(m),identifyScanStudent:async()=>{},
  prepareScanItem:async item=>({index:item.index,p:0}),
  remoteReadScan:async state=>{
   started.push(state.index);
   if(state.index!==0)await new Promise((_,reject)=>state.batchSignal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true}));
   state.remoteReady=true;
  },
  persistScanDraft:async state=>{commits.push(state.index);await context.cancelPendingBatch();}
 });
 const start=source.indexOf('async function cancelPendingBatch()');
 vm.runInContext(source.slice(start,source.indexOf('async function correctAllPending()',start))+code,context);
 await context.correctAllPending();
 assert.deepEqual(commits,[0]);assert(started.length-commits.length<=(authorized?5:1));assert.equal(context.scanQueue.length,0);
 assert.equal(context.batchProcessing,false);assert.match(toasts.at(-1),/أُلغيت/);
}
Promise.all([testCancel(false),testCancel(true)]).then(()=>console.log('PASS: active cancellation on both grading paths preserves committed work and prevents further submissions.')).catch(e=>{console.error(e);process.exit(1)});
