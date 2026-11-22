const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../runtime/auth-gate.js'),'utf8');
const handler=source.slice(source.indexOf('  async function deleteInactiveLicense('),source.indexOf('  function clearActivationMessage('));
async function run({cancel=false,owner=true,fail=false,email='client@example.test'}={}){
 const events=[],status={textContent:''},submit={disabled:false},label={hidden:false};let warning='';
 const form={elements:{ownerPin:{value:'synthetic-owner-code'}},querySelector:s=>s==='button'?submit:s==='label'?label:status};
 const user={uid:'owner-uid',email:'aaddaa5400@gmail.com',getIdToken:async fresh=>{assert.equal(fresh,true);return'fixture-token'}};
 const c={String,Date,Error,JSON,AbortSignal,ADMIN_EMAIL:user.email,window:{confirm:s=>{warning=s;return!cancel}},requireOwner:()=>{if(!owner)throw Error('not-owner');return user.uid},auth:{currentUser:user},authSdk:{EmailAuthProvider:{credential:(email,pin)=>({email,pin})},reauthenticateWithCredential:async()=>events.push('reauth')},document:{getElementById:()=>form,querySelector:()=>({content:'https://grading.example.invalid'})},modal:()=>events.push('dialog'),invoiceEscape:s=>s,closeOwnerMessages:()=>events.push('close'),clearActivationMessage(){},loadAdminLicenses:async()=>events.push('reload'),adminStatus(){},receiptRecord:async()=>events.push('receipt'),fetch:async(url,options)=>{assert.equal(url,'https://grading.example.invalid/v1/admin/subscriber-delete');assert.equal(options.headers.Authorization,'Bearer fixture-token');assert.deepEqual(JSON.parse(options.body),{email,confirm:true});events.push('server');return{ok:!fail,json:async()=>fail?{error:'DELETE_INCOMPLETE'}:{deleted:true}}}};
 vm.createContext(c);vm.runInContext(handler,c);
 if(!owner){await assert.rejects(c.deleteInactiveLicense({id:email},email,{}),/not-owner/);return;}
 await c.deleteInactiveLicense({id:email},email,{});
 if(form.onsubmit)await form.onsubmit({preventDefault(){}});
 return{events,status,warning,form,submit};
}
(async()=>{
 let r=await run();assert.deepEqual(r.events,['dialog','reauth','server','receipt','close','reload']);assert.match(r.warning,/نهائيًا من Firebase/);assert.match(r.status.textContent,/تم حذف حساب الدخول/);assert.equal(r.form.elements.ownerPin.value,'');
 r=await run({cancel:true});assert.deepEqual(r.events,[]);
 r=await run({email:'aaddaa5400@gmail.com'});assert.deepEqual(r.events,[]);
 r=await run({fail:true});assert.deepEqual(r.events,['dialog','reauth','server']);assert.match(r.status.textContent,/لم يكتمل/);assert.equal(r.submit.disabled,false);
 await run({owner:false});
 const storage=source.slice(source.indexOf('  let receiptDatabasePromise'),source.indexOf('  function closeOwnerMessages'));
 assert(storage.includes('AES-GCM'));assert(storage.includes('additionalData'));assert(!storage.includes('firebase.'));assert(!storage.includes('localStorage.setItem'));
 console.log('PASS: owner confirmation and reauthentication, server deletion, safe partial failure, cancel/self-delete protection and local receipt cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1});
