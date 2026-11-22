import test from 'node:test';
import assert from 'node:assert/strict';
import {deviceIdentity,addDevice,enrollDevice,deviceKey} from '../public/device-access.js';
const first='1'.repeat(64),second='2'.repeat(64),third='3'.repeat(64);
const at={seconds:1};
test('two devices permitted, existing one reuses its slot, third denied',()=>{
  const a=addDevice([],first,'Mac',at),b=addDevice(a,second,'Windows',at);
  assert.equal(b.length,2);assert.strictEqual(addDevice(b,first,'Mac',at),b);
  assert.throws(()=>addDevice(b,third,'Other',at),/DEVICE_LIMIT_REACHED/);
});
test('device identity survives reload and storage failures fail closed',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  assert.equal(deviceIdentity(storage),deviceIdentity(storage));
  assert.throws(()=>deviceIdentity({getItem:()=>null,setItem:()=>{}}),/DEVICE_STORAGE_REQUIRED/);
  assert.equal(deviceKey({email:'TEST@EXAMPLE.COM',uid:'ABC'}),'test@example.com');
});
test('enrollment does not rewrite an existing device, denies mismatched UID',async()=>{
  let writes=0;
  const storage={getItem:()=>first};
  let data={uid:'u1',devices:[{id:first,label:'Mac',addedAt:at}]};
  const sdk={doc:()=>({}),Timestamp:{now:()=>at},serverTimestamp:()=>at,
    runTransaction:async(db,fn)=>fn({get:async()=>({exists:()=>true,data:()=>data}),set:()=>writes++})};
  await enrollDevice(sdk,{}, {uid:'u1',email:'test@example.com'},{storage,label:'Mac'});
  assert.equal(writes,0);
  data={...data,uid:'foreign'};
  await assert.rejects(enrollDevice(sdk,{}, {uid:'u1',email:'test@example.com'},{storage,label:'Mac'}),/DEVICE_ACCOUNT_MISMATCH/);
});
