import { cp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
await cp(resolve(root,'public'),dist,{recursive:true});
await cp(resolve(root,'runtime/local.js'),resolve(dist,'local.js'));
await cp(resolve(root,'runtime/auth-gate.js'),resolve(dist,'auth-gate.js'));
await rm(resolve(dist,'cloud.js'),{force:true});
let html=await readFile(resolve(root,'site/index.html'),'utf8');
html=html.replace('<script src="cloud.js"></script>','<script src="auth-gate.js?v=account-actions-20261104"></script><script src="local.js"></script>').replace('حساب ChatGPT · حفظ سحابي','هذا المتصفح · حفظ محلي').replace('☁ بيانات مرتبطة بحسابك','◉ بيانات على جهازك').replace('جارٍ فتح حسابك…','جارٍ فتح بيانات هذا المتصفح…');
// Avoid a cached copy of the previous result-preview script on GitHub Pages.
html=html.replace('results-workflow.js?v=result-preview-layout-scrollfix-20261030','results-workflow.js?v=results-export-answers-excel-20261030');
await writeFile(resolve(dist,'index.html'),html);
const appPath=resolve(dist,'app.js');let app=await readFile(appPath,'utf8');
app=app.replace("const idb=new Promise((resolve,reject)=>{const r=indexedDB.open('waraqa-files',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});","const idb=new Promise((resolve,reject)=>{const open=()=>{const p=new URL('.',location.href).pathname,owner=localStorage.getItem('waraqa-pages-owner:'+p),name='waraqa-pages-files:'+p+(owner===window.WaraqaFirebaseUid?'':':'+window.WaraqaFirebaseUid),r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)};if(window.WaraqaFirebaseUid)open();else window.addEventListener('waraqa-authorized',open,{once:true})});");
app=app.replace('البيانات والصور مرتبطة بحساب ChatGPT وتُزامن بين أجهزتك. انتظر ظهور «محفوظ في حسابك» قبل الانتقال. انقل البيانات القديمة من المتصفح الأصلي مرة واحدة، واحتفظ بنسخة احتياطية.','البيانات والصور محفوظة في هذا المتصفح فقط. لن تظهر على جهاز أو متصفح آخر تلقائيًا. انقلها بالنسخ الاحتياطي والاستعادة، واحتفظ بنسخة قبل مسح بيانات الموقع.');
await writeFile(appPath,app);await writeFile(resolve(dist,'.nojekyll'),'');
console.log('Built GitHub Pages site in dist/; local browser storage, no server or paid storage required.');
