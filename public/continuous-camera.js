'use strict';
// Fixed-target camera stays open. Saving is immediate; corrections run serially off the capture UI.
const ContinuousCameraJobs={ids:[],pending:new Set(),running:false,promise:null};
function isContinuousCameraPending(id){return ContinuousCameraJobs.pending.has(id)}
function continuousCameraPageReady(s,points,canvas,now){
  const signature=documentFrameSignature(canvas);s.currentSignature=signature;
  return documentPageChanged(s,points,signature,now);
}
function enqueueContinuousCameraCorrection(id){
  if(ContinuousCameraJobs.pending.has(id))return;
  ContinuousCameraJobs.pending.add(id);ContinuousCameraJobs.ids.push(id);
  if(!ContinuousCameraJobs.running)ContinuousCameraJobs.promise=drainContinuousCameraCorrections();
}
async function drainContinuousCameraCorrections(){
  ContinuousCameraJobs.running=true;
  try{while(ContinuousCameraJobs.ids.length){
    const id=ContinuousCameraJobs.ids.shift();
    try{const r=db.results.find(x=>x.id===id&&x.captureStatus==='ungraded');if(r)await correctContinuousCameraRecord(r)}
    catch(error){console.warn('Camera sheet retained for review:',error?.message||'reading failed')}
    finally{
      ContinuousCameraJobs.pending.delete(id);
      if(!PaperCamera&&page==='results'){if(currentResult===id)reviewResult(id);else if(!currentResult)results()}
    }
  }}finally{ContinuousCameraJobs.running=false;}
}
async function readCameraBubbles(s,e){await remoteReadScan(s,e);}
async function correctContinuousCameraRecord(r){
  const e=db.exams.find(x=>x.id===r.exam);if(!e||capturedPageNumber(r,e)===null)return;
  const url=await fileGet(r.pages[0]);if(!url)throw Error('صورة الورقة غير متاحة');
  const image=await imageLoad(url),factor=Math.min(1,2600/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.width*factor));canvas.height=Math.max(1,Math.round(image.height*factor));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  const oriented=orientScanCanvas(canvas,e,8),s={canvas:oriented,url:oriented.toDataURL('image/jpeg',.95),exam:e.id,identityExam:e,backgroundIdentity:true,savedResultId:r.id,savedThisVisit:true,captureGroup:r.captureGroup||'',student:'',version:8,p:capturedPageNumber(r,e),orientationReady:oriented.scanOrientation?.confident!==false,corners:null,answers:{},essay:{},flags:{},readings:{}};
  await readCameraBubbles(s,e);if(!s.corners||s.orientationReady===false)return;
  await identifyScanStudent(s);
  // A user may have deleted the retained sheet while recognition was running.
  if(!db.results.some(x=>x.id===r.id))return;
  await persistScanDraft(s,e,true);
}
const captureBeforeContinuous=capturePaperFrame;
capturePaperFrame=async function(automatic=false){
  const s=PaperCamera;if(!s?.continuous)return captureBeforeContinuous(automatic);
  const video=$('#paper-camera-video');if(s.busy||!video?.videoWidth||video.readyState<2||(automatic&&!s.detected))return;
  s.busy=true;clearTimeout(s.timer);$('#paper-camera-capture').disabled=true;
  s.capturePromise=(async()=>{
    const factor=Math.min(1,3200/Math.max(video.videoWidth,video.videoHeight)),canvas=document.createElement('canvas');canvas.width=Math.round(video.videoWidth*factor);canvas.height=Math.round(video.videoHeight*factor);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
    const r=await saveCapturedDocument(s,canvas.toDataURL('image/jpeg',.95));
    s.capturedCount++;s.awaitingNext=true;s.changeFrames=0;s.lastSignature=s.currentSignature;s.lastCaptureAt=performance.now();s.previous=null;s.stableSince=0;
    if(cameraActive(s)){playPaperCameraShutter();$('#camera-session-count').textContent='· '+ar(s.capturedCount)+' ورقة محفوظة';cameraMessage('حُفظت الورقة '+ar(s.capturedCount)+' — ضع التالية. التصحيح في الخلفية.');}
    enqueueContinuousCameraCorrection(r.id);return r;
  })();
  try{await s.capturePromise}catch(error){if(cameraActive(s)){$('#paper-camera-auto').checked=false;cameraMessage(error.message||'تعذر حفظ الورقة. توقف الالتقاط التلقائي؛ أعد المحاولة.');}}
  finally{s.busy=false;s.capturePromise=null;if(cameraActive(s)){$('#paper-camera-capture').disabled=false;s.timer=setTimeout(()=>analysePaperFrame(s),120)}}
};
async function finishContinuousCamera(){
  const s=PaperCamera;if(!s?.continuous)return closePaperCamera();
  if(s.capturePromise)try{await s.capturePromise}catch{}
  stopPaperCamera();if(!s.capturedCount)return;
  currentResult=null;resultsExamFilter=s.examSnapshot.id;location.hash='results';results();
}
