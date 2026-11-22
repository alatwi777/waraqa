const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const code=fs.readFileSync('public/remote-grader.js','utf8');
(async()=>{let worker,windowTimers=0;class Worker{constructor(){worker=this;}postMessage(data){this.data=data;}terminate(){}}
const c=vm.createContext({Worker,document:{querySelector:()=>null},setTimeout:(fn)=>{windowTimers++;fn()},Date,Map,Promise,console});vm.runInContext(code,c);let done=false;const p=vm.runInContext('remoteWait(2000)',c).then(()=>done=true);assert.equal(windowTimers,0);assert.equal(worker.data.milliseconds,2000);worker.onmessage({data:worker.data.id});await p;assert.equal(done,true);
const q=vm.runInContext('remoteWait(2000)',c);worker.onerror();await q;assert.equal(windowTimers,1);
const app=fs.readFileSync('public/app.js','utf8');assert.match(app,/pg\.render\(\{canvasContext:sourceCanvas\.getContext\('2d'\),viewport:vp,intent:'print'\}\)/);assert.match(fs.readFileSync('public/pdf.min.js','utf8'),/useRequestAnimationFrame:!u/);
console.log('PASS: background wait uses worker messages; worker failure falls back; PDF render uses non-display scheduling.');})().catch(e=>{console.error(e);process.exit(1)});
