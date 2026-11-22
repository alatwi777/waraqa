export const DEVICE_LIMIT = 2;
const validId = id => typeof id === 'string' && /^[a-f0-9]{64}$/.test(id);
export function deviceKey(user) {
  return String(user?.email || user?.uid || '').trim().toLowerCase();
}
export function deviceIdentity(storage = localStorage, cryptoApi = crypto) {
  const key = 'waraqa-device-v1';
  let id = storage.getItem(key);
  if (!validId(id)) {
    id = Array.from(cryptoApi.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2,'0')).join('');
    storage.setItem(key,id);
    if (storage.getItem(key) !== id) throw Error('DEVICE_STORAGE_REQUIRED');
  }
  return id;
}
export function deviceLabel(agent = navigator.userAgent) {
  const system = /iPad/.test(agent) ? 'iPad' : /iPhone/.test(agent) ? 'iPhone' : /Android/.test(agent) ? 'Android' : /Windows/.test(agent) ? 'Windows' : /Mac/.test(agent) ? 'Mac' : 'جهاز';
  const browser = /Edg\//.test(agent) ? 'Edge' : /Chrome\//.test(agent) ? 'Chrome' : /Firefox\//.test(agent) ? 'Firefox' : /Safari\//.test(agent) ? 'Safari' : 'متصفح';
  return system+' — '+browser;
}
export function addDevice(devices,id,label,addedAt) {
  if (!validId(id)) throw Error('INVALID_DEVICE');
  if (!Array.isArray(devices) || devices.length > DEVICE_LIMIT) throw Error('INVALID_DEVICE_RECORD');
  if (devices.some(d => d.id === id)) return devices;
  if (devices.length >= DEVICE_LIMIT) throw Error('DEVICE_LIMIT_REACHED');
  return [...devices,{id,label:String(label).slice(0,80),addedAt}];
}
export async function enrollDevice(sdk,db,user,{storage,cryptoApi,label}={}) {
  const id=deviceIdentity(storage,cryptoApi),ref=sdk.doc(db,'accountDevices',deviceKey(user));
  await sdk.runTransaction(db,async tx=>{
    const snap=await tx.get(ref),prior=snap.exists()?snap.data():null;
    if (prior && prior.uid!==user.uid) throw Error('DEVICE_ACCOUNT_MISMATCH');
    const old=prior?.devices||[],devices=addDevice(old,id,label||deviceLabel(),sdk.Timestamp.now());
    if (devices===old) return;
    tx.set(ref,{uid:user.uid,email:String(user.email||'').trim().toLowerCase(),devices,updatedAt:sdk.serverTimestamp()});
  });
  return {id,ref};
}
