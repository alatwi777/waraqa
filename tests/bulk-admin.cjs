const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('runtime/auth-gate.js','utf8');
const part=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b));
{
 const c={bulkOwnerUid:'',bulkSelection:new Set(['gone@example.invalid']),bulkRecords:new Map(),requireOwner:()=> 'owner',ADMIN_EMAIL:'owner@example.invalid',String};vm.createContext(c);vm.runInContext(part('  function rebuildBulkRecords(','  function updateBulkActions('),c);
 c.rebuildBulkRecords([{id:'a@example.invalid',data:{email:'a@example.invalid'}},{id:'legacy',data:{email:'a@example.invalid'}},{id:'owner',data:{email:'owner@example.invalid'}}]);assert.equal(c.bulkRecords.size,1);assert.equal(c.bulkRecords.get('a@example.invalid').records.length,2);assert.equal(c.bulkSelection.size,0);
}
async function action(kind,initial,records){
 const state=new Map(Object.entries(initial)),writes=[],messages=[];let wrote=false;
 const c={requireOwner:()=> 'owner',asDate:d=>d,Date,db:{},firebase:{doc:(_,col,id)=>col+'/'+id,collection:(_, ...xs)=>xs.join('/'),addDoc:async(ref,data)=>messages.push({ref,data}),Timestamp:{now:()=>new Date(),fromDate:d=>d},serverTimestamp:()=> 'SERVER',runTransaction:async(_,fn)=>fn({get:async ref=>{assert.equal(wrote,false);return{exists:()=>state.has(ref),data:()=>state.get(ref)}},set:(ref,data)=>{wrote=true;writes.push({ref,data});state.set(ref,{...state.get(ref),...data})},update:(ref,data)=>{wrote=true;writes.push({ref,data});state.set(ref,{...state.get(ref),...data})}})}};
 vm.createContext(c);vm.runInContext(part('  async function applyBulkLicenseAction(','  function openBulkAction('),c);await c.applyBulkLicenseAction(kind,{email:'a@example.invalid',records},{days:30,message:'رسالة اختبار'},'owner');return{state,writes,messages};
}
async function batch({cancel=false,ambiguous=false}={}){
 const results=[],status={},progress={},button={disabled:false};let confirmations=0,reauth=0,requests=0;
 const form={elements:{ownerPin:{value:'synthetic'},days:{value:'30'},message:{value:'test'}},querySelector:s=>s==='button'?button:s==='[data-bulk-results]'?{replaceChildren(){results.length=0},append:r=>results.push(r.textContent)}:status};
 const c={bulkBusy:false,bulkSelection:new Set(['a@example.invalid','b@example.invalid']),bulkRecords:new Map(['a','b'].map(x=>[x+'@example.invalid',{email:x+'@example.invalid',records:[{id:x+'@example.invalid'}]}])),requireOwner:()=> 'owner',adminStatus(){},invoiceEscape:s=>s,modal(){},updateBulkActions(){},receiptRecord:async()=>{},loadAdminLicenses:async()=>{},auth:{currentUser:{uid:'owner',email:'owner@example.invalid',getIdToken:async()=> 'fixture'}},authSdk:{EmailAuthProvider:{credential:()=>({})},reauthenticateWithCredential:async()=>reauth++},window:{confirm:()=>{confirmations++;return!cancel}},document:{getElementById:()=>form,querySelector:s=>s.startsWith('meta')?{content:'https://grading.example.invalid'}:progress,createElement:()=>({})},fetch:async(url,opts)=>{requests++;const index=requests;assert.equal(url,'https://grading.example.invalid/v1/admin/subscriber-delete');assert.equal(opts.headers.Authorization,'Bearer fixture');assert.equal(JSON.parse(opts.body).confirm,true);assert.equal(opts.body.includes('synthetic'),false);if(ambiguous)throw Error('network');return{ok:index===1,json:async()=>index===1?{deleted:true}:{error:'DELETE_INCOMPLETE'}}},AbortSignal,Error,Number,JSON};
 vm.createContext(c);vm.runInContext(part('  function openBulkAction(','  async function loadAdminLicenses('),c);c.openBulkAction('delete');await form.onsubmit({preventDefault(){}});return{c,results,status,confirmations,reauth,requests,form};
}
(async()=>{
 const future=new Date(Date.now()+86400000*10);let r=await action('renew',{'licenses/a@example.invalid':{active:true,expiresAt:future}},[{id:'a@example.invalid'}]);assert.equal(r.state.get('licenses/a@example.invalid').expiresAt.getTime(),future.getTime()+30*86400000);assert.equal(r.writes.length,1);
 const before=Date.now();r=await action('renew',{'licenses/a@example.invalid':{active:false,expiresAt:future}},[{id:'a@example.invalid'}]);assert.ok(r.state.get('licenses/a@example.invalid').expiresAt.getTime()>=before+30*86400000);
 r=await action('stop',{'licenses/a@example.invalid':{active:true,expiresAt:future},'licenses/legacy':{active:true,expiresAt:future}},[{id:'a@example.invalid'},{id:'legacy'}]);assert.equal(r.state.get('licenses/a@example.invalid').active,false);assert.equal(r.state.get('licenses/legacy').active,false);
 r=await action('message',{},[{id:'legacy'}]);assert.equal(r.messages.length,1);assert.equal(r.messages[0].ref,'customerInbox/legacy/messages');assert.equal(r.messages[0].data.text,'رسالة اختبار');
 let b=await batch();assert.equal(b.confirmations,1);assert.equal(b.reauth,1);assert.equal(b.requests,2);assert.deepEqual([...b.c.bulkSelection],['b@example.invalid']);assert.equal(b.results.length,2);assert.match(b.status.textContent,/نجح 1 من 2/);assert.equal(b.form.elements.ownerPin.value,'');
 b=await batch({cancel:true});assert.equal(b.requests,0);assert.equal(b.reauth,0);
 b=await batch({ambiguous:true});assert.equal(b.requests,2);assert.equal(b.c.bulkSelection.size,2);
 console.log('PASS: deduplicated selection and owner exclusion, renewal from expiry/today, canonical+legacy stop, one inbox message, single batch confirmation/reauthentication, per-account partial results and no ambiguous replay.');
})().catch(e=>{console.error(e);process.exitCode=1});
