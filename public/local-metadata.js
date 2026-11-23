'use strict';
// A small synchronous write-ahead journal protects changes until IndexedDB commits.
// Personal records never leave this browser. Legacy data is retained until verified.
(function(root){
 const clone=value=>JSON.parse(JSON.stringify(value));
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 function keys(rows){const count=new Map();for(const r of rows)if(r&&typeof r.id==='string')count.set(r.id,(count.get(r.id)||0)+1);return rows.map((r,i)=>r&&typeof r.id==='string'&&count.get(r.id)===1?'id:'+r.id:'index:'+i);}
 function difference(base,next){const patch={fields:Object.create(null),removed:[],arrays:Object.create(null)};for(const key of Object.keys(base))if(!(key in next))patch.removed.push(key);
  for(const [key,value]of Object.entries(next)){if(equal(base[key],value))continue;if(Array.isArray(value)&&Array.isArray(base[key])){const before=new Map(keys(base[key]).map((k,i)=>[k,base[key][i]])),order=keys(value),put=Object.create(null);order.forEach((k,i)=>{if(!before.has(k)||!equal(before.get(k),value[i]))put[k]=value[i];});patch.arrays[key]={order,put};}else patch.fields[key]=value;}return patch;
 }
 function apply(base,patch){const value=clone(base);for(const key of patch.removed)delete value[key];for(const [key,v]of Object.entries(patch.fields))Object.defineProperty(value,key,{value:v,writable:true,enumerable:true,configurable:true});for(const [key,change]of Object.entries(patch.arrays)){if(!Array.isArray(value[key]))throw Error('JOURNAL_BASE_INVALID');const rows=new Map(keys(value[key]).map((k,i)=>[k,value[key][i]]));for(const [k,r]of Object.entries(change.put))rows.set(k,r);value[key]=change.order.map(k=>{if(!rows.has(k))throw Error('JOURNAL_ROW_MISSING');return rows.get(k);});}return value;}
 async function open({storage,key,read,write,initial,validate,onStatus=()=>{},maxJournalBytes=1024*1024,writer='writer-'+Math.random().toString(36).slice(2)}){
  let base,latest,revision=0,diskRevision=null,blocked=false,flushing=null,replacing=false;
  const status=(state,error)=>onStatus({state,error});
  const parse=()=>{const text=storage.getItem(key);return text===null?null:JSON.parse(text);};
  const journal=(checkpoint,current)=>({version:3,revision:current.revision,baseRevision:checkpoint.revision,writer,patch:difference(checkpoint.data,current.data)});
  const putJournal=record=>{const text=JSON.stringify(record);if(text.length*2>maxJournalBytes)throw Error('JOURNAL_PENDING_LIMIT');storage.setItem(key,text);};
  const stored=await read();diskRevision=stored?.current?.revision??null;const originalText=storage.getItem(key),record=parse();
  if(record?.version===3){const checkpoint=[stored?.current,stored?.previous].find(x=>x?.revision===record.baseRevision);if(!checkpoint||record.revision<checkpoint.revision)throw Error('METADATA_CHECKPOINT_MISSING');base=clone(checkpoint);revision=record.revision;latest={revision,data:apply(base.data,record.patch)};}
  else{let data,rev;if(record?.version===1){data=record.data;rev=record.revision;}else if(record&&validate(record)){data=record;rev=0;}else if(record!==null)throw Error('LEGACY_DATA_INVALID');else{data=stored?.current?.data||initial;rev=stored?.current?.revision||0;}
   if(!validate(data)||!Number.isSafeInteger(rev)||rev<0)throw Error('LEGACY_DATA_INVALID');if(diskRevision!==null&&diskRevision>rev)throw Error('METADATA_REVISION_CONFLICT');base={revision:rev,data:clone(data)};latest=clone(base);revision=rev;
   await write({current:base,previous:stored?.current||null},diskRevision);const verified=await read();if(!equal(verified?.current,base))throw Error('MIGRATION_VERIFY_FAILED');diskRevision=rev;
  }
  if(!validate(latest.data))throw Error('METADATA_INVALID');
  // Recovered journal remains durable even when its checkpoint is still pending.
  if(storage.getItem(key)!==originalText)throw Error('METADATA_OTHER_TAB');putJournal(journal(base,latest));
  async function drain(){try{while(true){const before=parse();if(before?.revision!==revision||before.writer!==writer){blocked=true;throw Error('METADATA_OTHER_TAB');}const target=clone(latest);await write({current:target,previous:base},diskRevision);diskRevision=target.revision;
    const after=parse();if(after?.revision!==revision||after.writer!==writer){blocked=true;throw Error('METADATA_OTHER_TAB');}
    // Keep the previous checkpoint until the journal has been durably rebased.
    putJournal(journal(target,latest));base=target;if(target.revision===revision){status('saved');return true;}}
   }catch(error){status('error',error.message);return false;}}
  function flush(){if(flushing)return flushing;flushing=drain().finally(()=>{flushing=null;});return flushing;}
  function save(data){if(replacing){status('error','METADATA_REPLACE_IN_PROGRESS');return false;}if(blocked){status('error','METADATA_OTHER_TAB');return false;}try{const existing=parse();if(existing?.revision!==revision||existing.writer!==writer){blocked=true;throw Error('METADATA_OTHER_TAB');}const target={revision:revision+1,data:clone(data)};if(!validate(target.data))throw Error('METADATA_INVALID');putJournal(journal(base,target));latest=target;revision=target.revision;status('pending');void flush();return true;}catch(error){status('error',error.message);return false;}}
  async function replace(data){if(replacing||blocked)return false;if(!await flush()||replacing||blocked)return false;replacing=true;try{const existing=parse();if(existing?.revision!==revision||existing.writer!==writer)throw Error('METADATA_OTHER_TAB');const target={revision:revision+1,data:clone(data)};if(!validate(target.data))throw Error('METADATA_INVALID');status('pending');await write({current:target,previous:base},diskRevision);diskRevision=target.revision;const verified=await read();if(!equal(verified?.current,target))throw Error('METADATA_VERIFY_FAILED');const after=parse();if(after?.revision!==revision||after.writer!==writer)throw Error('METADATA_OTHER_TAB');putJournal(journal(target,target));base=clone(target);latest=target;revision=target.revision;status('saved');return true;}catch(error){if(error.message==='METADATA_OTHER_TAB')blocked=true;status('error',error.message);return false;}finally{replacing=false;}}
  await flush();return{data:clone(latest.data),save,flush,replace,block(){blocked=true;},get revision(){return revision;}};
 }
 function pack(value){const data=clone(value),table=[],indices=new Map();for(const checkpoint of [data.current,data.previous])for(const row of checkpoint?.data?.results||[]){if(!row.snapshot)continue;const signature=JSON.stringify(row.snapshot);let index=indices.get(signature);if(index===undefined){index=table.length;indices.set(signature,index);table.push(row.snapshot);}row.snapshot={__waraqa_snapshot_index:index};}return{storageVersion:1,snapshotTable:table,...data};}
 function unpack(value){if(!value||value.storageVersion!==1)return value;const data=clone(value);for(const checkpoint of [data.current,data.previous])for(const row of checkpoint?.data?.results||[]){const index=row.snapshot?.__waraqa_snapshot_index;if(index!==undefined){if(!Number.isInteger(index)||!data.snapshotTable[index])throw Error('SNAPSHOT_REFERENCE_INVALID');row.snapshot=clone(data.snapshotTable[index]);}}delete data.storageVersion;delete data.snapshotTable;return data;}
 async function browser(options){const db=await new Promise((resolve,reject)=>{const r=options.indexedDB.open('waraqa-pages-metadata:'+options.path,1);r.onupgradeneeded=()=>r.result.createObjectStore('accounts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('METADATA_OPEN_BLOCKED'));});
  const read=()=>new Promise((resolve,reject)=>{const t=db.transaction('accounts','readonly'),r=t.objectStore('accounts').get(options.key);r.onsuccess=()=>{try{resolve(unpack(r.result||null));}catch(error){reject(error);}};r.onerror=()=>reject(r.error);});
  const write=(value,expected)=>new Promise((resolve,reject)=>{let t;try{t=db.transaction('accounts','readwrite',{durability:'strict'});}catch{t=db.transaction('accounts','readwrite');}const s=t.objectStore('accounts'),r=s.get(options.key);let conflict=false;r.onsuccess=()=>{if((r.result?.current?.revision??null)!==expected){conflict=true;t.abort();return;}s.put(pack(value),options.key);};t.oncomplete=resolve;t.onabort=()=>reject(Error(conflict?'METADATA_OTHER_TAB':'METADATA_WRITE_FAILED'));t.onerror=()=>reject(t.error);});
  return open({...options,read,write});
 }
 root.WaraqaMetadata={open,browser,difference,apply,pack,unpack};
})(typeof window==='undefined'?globalThis:window);
