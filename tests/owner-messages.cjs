const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../runtime/auth-gate.js'),'utf8');
const handler=source.slice(source.indexOf('  async function deleteInactiveLicense('),source.indexOf('  function clearActivationMessage('));
async function run({active=false,expiry=Date.now()+86400000,siblingActive=false,cancel=false,owner=true}={}){
 const events=[],button={disabled:false};let status='';
 const data={email:'client@example.test',active,expiresAt:expiry};
 const sibling={id:'legacy-uid',data:()=>({email:'client@example.test',active:siblingActive,expiresAt:Date.now()+86400000})};
 const c={String,Date,Error,window:{confirm:()=>!cancel},requireOwner:()=>{if(!owner)throw Error('not-owner');return 'owner-uid';},db:{},asDate:value=>new Date(value),closeOwnerMessages:()=>events.push('close'),loadAdminLicenses:async()=>events.push('reload'),adminStatus:text=>{status=text;},receiptRecord:async(uid,email,value,remove)=>events.push(['remove-message',uid,email,remove]),firebase:{collection(){},doc:(_db,_col,id)=>id,getDocs:async()=>({docs:[{id:data.email,data:()=>data},sibling]}),runTransaction:async(_db,fn)=>fn({get:async id=>({exists:()=>true,data:()=>id==='legacy-uid'?sibling.data():data}),delete:id=>events.push(['delete',id])})}};
 vm.createContext(c);vm.runInContext(handler,c);
 if(!owner){await assert.rejects(c.deleteInactiveLicense({id:data.email},data.email,button),/not-owner/);return;}
 await c.deleteInactiveLicense({id:data.email},data.email,button);return {events,status,button};
}
(async()=>{
 let r=await run({active:true});assert(!r.events.some(x=>Array.isArray(x)&&x[0]==='delete'));assert.match(r.status,/مفعّل/);assert.equal(r.button.disabled,false);
 r=await run({active:false});assert.deepEqual(r.events,[['delete','client@example.test'],['remove-message','owner-uid','client@example.test',true],'close','reload']);
 r=await run({active:true,expiry:Date.now()-1});assert(r.events.some(x=>Array.isArray(x)&&x[0]==='delete'));
 r=await run({active:false,siblingActive:true});assert.equal(r.events.length,0);
 r=await run({cancel:true});assert.equal(r.events.length,0);
 await run({owner:false});
 // Storage remains owner-bound and ciphertext-only; no credential writes go to Firestore.
 const storage=source.slice(source.indexOf('  let receiptDatabasePromise'),source.indexOf('  function closeOwnerMessages'));
 assert(storage.includes('AES-GCM'));assert(storage.includes('additionalData'));assert(storage.includes('false, ["encrypt", "decrypt"]'));assert(!storage.includes('firebase.'));assert(!storage.includes('localStorage.setItem'));
 console.log('PASS: owner-only inactive deletion, active and reactivated records protected, expired deletion, sibling guard, confirmation cancel, encrypted local-only receipt storage.');
})();
