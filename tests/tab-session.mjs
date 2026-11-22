import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {tabSessionSpec,initializeBrowserSession} from '../public/tab-session.js';
const config={projectId:'synthetic'},calls=[];
const storage=()=>{const map=new Map();return{getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};};
const appSdk={initializeApp:(config,name='[DEFAULT]')=>{calls.push(['app',name]);return{name};}};
const SESSION={},authSdk={browserSessionPersistence:SESSION,getAuth:app=>{calls.push(['default',app.name]);return{app};},initializeAuth:(app,dependencies)=>{calls.push(['session',app.name,dependencies.persistence]);return{app};}};
assert.equal(tabSessionSpec('https://site.invalid/'),null);
const normal=initializeBrowserSession({href:'https://site.invalid/',config,appSdk,authSdk});assert.equal(normal.app.name,'[DEFAULT]');assert.equal(calls.at(-1)[0],'default');
const names=new Set();for(let n=1;n<=15;n++){
 const slot=String(n).padStart(2,'0'),saved=storage();saved.setItem('unrelated','keep');const instance=initializeBrowserSession({href:'https://site.invalid/?tab-session='+slot,config,appSdk,authSdk,storage:saved});
 assert.equal(instance.spec.slot,slot);assert.notEqual(instance.app.name,'[DEFAULT]');assert.equal(calls.at(-1)[0],'session');assert.equal(calls.at(-1)[2],SESSION);assert.equal(saved.getItem('unrelated'),'keep');assert.equal(saved.getItem('waraqa-tab-session-probe'),null);names.add(instance.app.name);
}
assert.equal(names.size,15);assert.equal(calls.filter(c=>c[0]==='default').length,1);
for(const value of ['0','00','16','1','01&tab-session=02','https://evil.invalid/','../owner'])assert.throws(()=>tabSessionSpec('https://site.invalid/?tab-session='+value),/INVALID_TAB_SESSION/);
assert.throws(()=>initializeBrowserSession({href:'https://site.invalid/?tab-session=01',config,appSdk,authSdk,storage:{getItem(){return null;},setItem(){throw Error('blocked');},removeItem(){}}}));
const adapter=readFileSync('runtime/auth-gate.js','utf8');assert.ok(adapter.includes('tabsModule.initializeBrowserSession'));assert.ok(adapter.includes('await checkLicense(user)'));assert.ok(adapter.includes('deviceSdk.enrollDevice'));assert.ok(adapter.includes('WaraqaGetIdToken'));assert.ok(!adapter.includes('setPersistence(auth,'));
console.log('PASS:15 distinct SESSION app namespaces, normal LOCAL initialization unchanged, strict slot validation, blocked storage fails closed, existing license/device/token checks retained.');

// Exercise the existing real local-storage bootstrap for15 account UIDs sharing one browser.
const {default:vm}=await import('node:vm');
const localSource=readFileSync('runtime/local.js','utf8'),memory=new Map([['waraqa-pages-owner:/waraqa/','normal-owner']]);
const ownerData={students:[{id:'owner-record',name:'owner',number:'000'}],groups:[],exams:[],results:[]};
memory.set('waraqa-pages-v1:/waraqa/',JSON.stringify({version:1,revision:1,data:ownerData}));
function localContext(uid,slot){const nodes=new Map();const context={URL,location:{href:'https://site.invalid/waraqa/?tab-session='+slot},window:{WaraqaAuthGate:true,WaraqaAuthorized:true,WaraqaFirebaseUid:uid,addEventListener(){}},localStorage:{getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)},db:{students:[],groups:[],exams:[],results:[]},save(){},$:key=>{if(!nodes.has(key))nodes.set(key,{textContent:'',innerHTML:'',dataset:{}});return nodes.get(key);},esc:String,route(){},download(){},modal(){},btn(){}};vm.createContext(context);vm.runInContext(localSource,context);return context;}
const dataKeys=new Set();for(let i=1;i<=15;i++){const uid='synthetic-account-'+i,ctx=localContext(uid,String(i).padStart(2,'0'));assert.equal(ctx.db.students.length,0);ctx.db.students.push({id:'record-'+i,name:'Synthetic '+i,number:String(i).padStart(3,'0')});assert.equal(ctx.save(),true);dataKeys.add(vm.runInContext('LocalStore.key',ctx));}
assert.equal(dataKeys.size,15);assert.equal(JSON.parse(memory.get('waraqa-pages-v1:/waraqa/')).data.students[0].id,'owner-record');
for(let i=1;i<=15;i++)assert.equal(localContext('synthetic-account-'+i,'01').db.students[0].id,'record-'+i);
const launcher=readFileSync('public/tab-sessions.html','utf8');assert.equal((launcher.match(/href="\.\/\?tab-session=/g)||[]).length,15);assert.ok(launcher.includes('rel="noopener"'));assert.ok(!launcher.includes('123456'));
console.log('PASS: existing browser storage remains UID-scoped across15 tabs; normal owner record preserved; launcher has15 isolated links without passwords.');
