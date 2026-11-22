const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto,createHash}=require('node:crypto');
const adapter=fs.readFileSync('public/remote-grader.js','utf8');
const result={apiVersion:1,version:8,page:0,answers:{0:0},essay:{'-1':null},flags:{},readings:{},corners:null,imageSize:{width:1000,height:700},orientationReady:true};
function input(){return{s:{url:'data:image/jpeg;base64,c3ludGhldGlj',canvas:{width:1000,height:700,toDataURL:()=> 'data:image/jpeg;base64,c3ludGhldGlj'},version:8,p:0},e:{id:'exam',questions:[{type:'mcq',text:'Question',options:['A','B'],answer:0,points:1}]}};}
function client(fetchImpl,records=[]){let serial=0;const context=vm.createContext({window:{WaraqaAuthorized:true,WaraqaFirebaseUid:'user',WaraqaGetIdToken:async()=>'token'},document:{querySelector:selector=>selector.startsWith('meta')?{content:'https://synthetic.invalid'}:{hidden:true,textContent:''}},db:{results:records},uid:()=>String(++serial),filePut:async()=>{},save:()=>true,setTimeout:fn=>fn(),fetch:fetchImpl,AbortSignal,Error,console,TextEncoder,crypto:webcrypto,Uint8Array});vm.runInContext(adapter,context);return context;}
async function read(ctx,input){ctx.s=input.s;ctx.e=input.e;return vm.runInContext('remoteReadScan(s,e)',ctx);}
(async()=>{
 let submitted=0,retrieved=0,id;const first=input();
 const ctx=client(async(url,options)=>{
  if(url.endsWith('/healthz'))return{ok:true,json:async()=>({durableJobs:true})};
  if(options.method==='POST'){
   submitted++;const body=JSON.parse(options.body);id=createHash('sha256').update(JSON.stringify(['user',body])).digest('hex');
   assert.equal(ctx.db.results[0].remoteJob.id,id,'ID must be saved before upload');
   throw new TypeError('simulated lost POST response');
  }
  retrieved++;assert.ok(url.endsWith('/'+id));return{ok:true,status:200,json:async()=>({jobId:id,state:'done',result})};
 });
 await read(ctx,first);assert.equal(submitted,1);assert.equal(retrieved,1);assert.equal(first.s.remoteReady,true);
 // Refresh/reopen the locally retained paper: fetch the old job, never submit again.
 const records=JSON.parse(JSON.stringify(ctx.db.results)),reopened=input();reopened.s.savedResultId=records[0].id;
 const afterRefresh=client(async(url,options)=>{
  if(url.endsWith('/healthz'))return{ok:true,json:async()=>({durableJobs:true})};
  assert.equal(options.method,'GET');return{ok:true,status:200,json:async()=>({jobId:id,state:'done',result})};
 },records);
 await read(afterRefresh,reopened);assert.equal(reopened.s.remoteReady,true);
 let sends=0;const blocked=client(async url=>{if(url.endsWith('/healthz'))return{ok:true,json:async()=>({durableJobs:true})};sends++;return{ok:false,status:403,json:async()=>({error:'SUBSCRIPTION_INACTIVE'})};});
 await assert.rejects(read(blocked,input()),/الاشتراك/);assert.equal(sends,1);
 const unsaved=client(async url=>({ok:true,json:async()=>({durableJobs:true})}));vm.runInContext('save=()=>false',unsaved);await assert.rejects(read(unsaved,input()),/حفظ/);
 console.log('PASS: lost upload response recovers by saved ID; refresh retrieves same result; revoked access and local save failure stop submission.');
})().catch(e=>{console.error(e);process.exitCode=1;});
