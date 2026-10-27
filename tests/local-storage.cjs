const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'../runtime/local.js'),'utf8');
const memory=new Map();let writes=0,deny=false;const events={};
function context(){const nodes=new Map();const node=s=>{if(!nodes.has(s))nodes.set(s,{innerHTML:'',textContent:'',dataset:{},hidden:false});return nodes.get(s);};const ctx={URL,location:{href:'https://owner.github.io/waraqa/'},localStorage:{getItem:k=>memory.get(k)??null,setItem(k,v){if(deny)throw Error('quota');writes++;memory.set(k,v);}},window:{addEventListener:(name,fn)=>events[name]=fn},db:{students:[],groups:[],exams:[],results:[]},save(){},$:node,esc:String,route(){ctx.routed=true;},download(){},modal(){},btn(){return '';}};vm.createContext(ctx);vm.runInContext(code,ctx);ctx.node=node;return ctx;}
let ctx=context();assert(ctx.routed);assert.equal(ctx.node('#cloud-boot').hidden,true);assert.equal(writes,0);ctx.db.students.push({id:'s',name:'طالب',number:'001'});assert.equal(ctx.save(),true);assert.equal(writes,1);assert(ctx.node('#cloud-status').textContent.includes('محفوظ'));
const reopened=context();assert.equal(reopened.db.students[0].number,'001');reopened.db.exams.push({id:'exam',questions:[{type:'mcq',text:'سؤال'}]});assert.equal(reopened.save(),true);
// An older tab must not silently overwrite the newer stored snapshot.
assert.equal(ctx.save(),false);assert.equal(writes,2);assert(ctx.node('#cloud-banner').innerHTML.includes('نافذة أخرى'));
ctx=context();deny=true;ctx.db.students.push({id:'new'});assert.equal(ctx.save(),false);assert(ctx.node('#cloud-status').textContent.includes('تعذر'));deny=false;
memory.set('waraqa-pages-v1:/waraqa/','not-json');ctx=context();assert.equal(ctx.routed,undefined);assert.equal(ctx.save(),false);assert.equal(memory.get('waraqa-pages-v1:/waraqa/'),'not-json');
console.log('PASS: GitHub Pages local save/reload, student leading zeros, multi-tab stale-write guard, quota errors, malformed data never overwritten.');
