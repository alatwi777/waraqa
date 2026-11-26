const api='https://waraqa-owner-scaling-481064076419.europe-west1.run.app/workers';
const consoleUrl='https://console.cloud.google.com/run/detail/europe-west1/waraqa-grader-test04/scaling?project=gen-lang-client-0439699709';

export function mountWorkers(overlay,user,isCurrentOwner){
 const old=overlay.querySelector('.wa-worker-controls');
 if(old?.dataset.busy==='true')return;
 const panel=document.createElement('section');
 panel.className='wa-worker-controls';
 panel.innerHTML=`<h3>عمّال التصحيح</h3><form class="wa-admin-form"><label>الحد الأدنى<input name="minimum" type="number" min="0" max="100" step="1" required></label><label>الحد الأقصى<input name="maximum" type="number" min="1" max="100" step="1" required></label><button type="submit" disabled>تطبيق</button><a class="wa-quota-link" target="_blank" rel="noopener" href="${consoleUrl}">تحقّق في Google Cloud</a></form><p class="wa-admin-message" role="status"></p><button type="button" class="wa-admin-form-button">تحديث القيم</button>`;
 if(old)old.replaceWith(panel);
 else overlay.querySelector('.wa-admin-stats').after(panel);
 const form=panel.querySelector('form'),minimum=form.elements.minimum,maximum=form.elements.maximum;
 const submit=form.querySelector('button'),refresh=panel.lastElementChild,status=panel.querySelector('[role=status]');
 let current;
 function busy(flag){
  panel.dataset.busy=String(flag);
  minimum.disabled=maximum.disabled=submit.disabled=flag||!current||current.pending||current.manual;
  refresh.disabled=flag;
 }
 async function call(change){
  if(!isCurrentOwner()||!panel.isConnected)throw Error('أعد فتح اللوحة بحساب المالك.');
  const token=await user.getIdToken();
  const headers={Authorization:'Bearer '+token};
  if(change)headers['Content-Type']='application/json';
  const response=await fetch(api,{method:change?'POST':'GET',headers,body:change?JSON.stringify(change):undefined,cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(response.status===409?'تغيّرت الإعدادات. حدّث القيم قبل التطبيق.':response.status===403?'هذه الصلاحية لحساب المالك فقط.':'تعذّر الاتصال بخدمة التحكم. تحقّق من Google Cloud ثم حدّث القيم.');
  return response.json();
 }
 function display(value){
  current=value;minimum.value=value.min;maximum.value=value.max;
 }
 async function load(){
  busy(true);status.textContent='جارٍ قراءة الإعدادات من Google…';
  try{display(await call());status.textContent=current.manual?'الخدمة مضبوطة على التوسّع اليدوي. راجع إعدادات Google Cloud.':current.pending?'تحديث Google قيد التنفيذ. حدّث القيم بعد قليل.':'القيم الحالية من Google Cloud. الحد الأدنى فوق الصفر يُبقي عمّالًا جاهزين وقت الخمول.';}
  catch(error){current=null;status.textContent=error.message;}
  finally{busy(false);}
 }
 refresh.onclick=load;
 form.onsubmit=async event=>{
  event.preventDefault();
  if(!current||submit.disabled)return;
  const min=minimum.valueAsNumber,max=maximum.valueAsNumber;
  if(!form.reportValidity())return;
  if(min>max){status.textContent='الحد الأدنى يجب أن يكون أصغر من الحد الأقصى أو مساويًا له.';return;}
  busy(true);status.textContent='جارٍ تطبيق إعدادات العمّال…';
  try{
   const etag=current.etag;
   await call({min,max,etag});
   for(let attempt=0;attempt<20;attempt++){
    const next=await call();
    if(!next.pending && next.min===min && next.max===max){
     display(next);status.textContent='أكد Google تطبيق الحد الأدنى '+min+' والحد الأقصى '+max+'.';return;
    }
    await new Promise(resolve=>setTimeout(resolve,1500));
   }
   throw Error('لم يصل تأكيد التطبيق بعد. حدّث القيم أو تحقّق في Google Cloud.');
  }catch(error){current=null;status.textContent=error.message;}
  finally{busy(false);}
 };
 load();
}
