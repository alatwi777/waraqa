const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../runtime/auth-gate.js'), 'utf8');
function harness() {
  let now = 1000, signedOut = 0, timerId = 0;
  const listeners = new Map(), timers = new Map(), events = new Map();
  const field = {hidden: true, value: 'SECRET'}, gate = {}, workspace = {tagName:'MAIN',inert:false};
  const state = {title:'',message:''};
  const c = {console, Map, Set, Promise, Number, String,
    Date: {now:()=>now}, gate, auth:{currentUser:{uid:'u',email:'client@example.test'}},db:{},
    window:{WaraqaAuthorized:true,addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n)},
    document:{body:{children:[gate,workspace]},visibilityState:'visible',addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n)},
    $:()=>field,showGate:t=>{state.title=t;},setMessage:t=>{state.message=t;},closeAdminDashboard(){},
    expirationValue:d=>d?.expiresAt ? {getTime:()=>d.expiresAt}:null,
    setTimeout:(f,ms)=>{timers.set(++timerId,{f,at:now+ms});return timerId;},clearTimeout:id=>timers.delete(id),
    firebase:{doc:(_db,_col,id)=>id,onSnapshot:(id,fn,error)=>{listeners.set(id,{fn,error});return()=>listeners.delete(id);},signOut:()=>{signedOut++;return Promise.resolve();}}
  };
  vm.createContext(c);
  vm.runInContext(source.slice(source.indexOf('  let licenseWatchCleanup ='),source.indexOf('  async function authorize(user)')),c);
  const snap = data=>({exists:()=>data!==null,data:()=>data});
  const emit = (id,data)=>listeners.get(id)?.fn(snap(data));
  const advance = t=>{now=t;for(const [id,timer]of [...timers])if(timer.at<=now){timers.delete(id);timer.f();}};
  return {c,listeners,timers,events,state,workspace,field,emit,advance,signedOut:()=>signedOut,start:()=>c.startLicenseWatch(c.auth.currentUser,{getTime:()=>5000})};
}
{
 const h=harness();h.start();h.emit('client@example.test',{active:true,expiresAt:5000});
 h.emit('u',{active:true,expiresAt:9000});h.emit('client@example.test',{active:false,expiresAt:5000});
 assert.equal(h.c.window.WaraqaAuthorized,false);assert.equal(h.workspace.inert,true);assert.equal(h.field.hidden,false);assert.equal(h.field.value,'');assert.match(h.state.message,/إيقاف/);assert.equal(h.signedOut(),1);assert.equal(h.listeners.size,0);assert.equal(h.timers.size,0);
}
{
 const h=harness();h.start();h.emit('client@example.test',{active:true,expiresAt:5000});h.advance(5000);
 assert.equal(h.signedOut(),1);assert.match(h.state.message,/انتهت/);
}
{
 const h=harness();h.start();h.emit('client@example.test',{active:true,expiresAt:5000});h.emit('client@example.test',{active:true,expiresAt:10000});h.advance(5000);assert.equal(h.signedOut(),0);h.advance(10000);assert.equal(h.signedOut(),1);
}
{
 const h=harness();h.start();h.emit('client@example.test',null);h.emit('u',{active:true,expiresAt:8000});assert.equal(h.signedOut(),0);h.emit('client@example.test',{active:false,expiresAt:9000});assert.equal(h.signedOut(),1);
}
{
 const h=harness();h.start();const late=h.listeners.get('client@example.test').fn;h.c.stopLicenseWatch();late({exists:()=>true,data:()=>({active:false})});assert.equal(h.signedOut(),0);assert.equal(h.events.size,0);
}
{
 const h=harness();h.start();h.listeners.get('client@example.test').error();assert.equal(h.signedOut(),1);
}
// Exercise the request renderer with mixed pending and historical activated requests.
{
 let callback;
 const node=()=>({children:[],style:{},dataset:{},appendChild(x){this.children.push(x);},append(...xs){this.children.push(...xs);},setAttribute(){},querySelectorAll(){return[];},replaceChildren(){this.children=[];}});
 const body=node();
 const c={Map,auth:{currentUser:{email:'owner'}},isAdminAccount:()=>true,adminRequestsUnsubscribe:null,adminProvisionBusy:false,adminStatus(){},asDate:()=>null,setCell:(r,t)=>r.appendChild({textContent:t}),generateAccessPin:()=>'',activateSubscriptionRequest(){},document:{getElementById:()=>body,createElement:node},firebase:{collection(){},onSnapshot:(_ref,fn)=>{callback=fn;return()=>{};}},db:{}};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('  function loadAdminRequests()'),source.indexOf('  async function activateSubscriptionRequest(')),c);
 c.loadAdminRequests();
 callback({docs:[{id:'pending',data:()=>({status:'pending',name:'PENDING'})},{id:'old',data:()=>({status:'activated',name:'OLD'})}]});
 assert.equal(body.children.length,1);assert.equal(body.children[0].children[0].textContent,'PENDING');
 callback({docs:[{id:'pending',data:()=>({status:'activated'})}]});assert.match(body.children[0].children[0].textContent,/لا توجد طلبات/);
}
console.log('PASS: immediate revocation, expiry without refresh, renewal reschedules expiry, canonical stopped license overrides legacy, listener cleanup, error lock, and activated requests leave pending list.');
