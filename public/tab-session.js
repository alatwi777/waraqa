// Named Firebase apps keep SESSION test tabs separate from the normal LOCAL login.
export function tabSessionSpec(href){
 const params=new URL(href).searchParams;if(!params.has('tab-session'))return null;
 const slot=params.get('tab-session');if(params.getAll('tab-session').length!==1||!/^(0[1-9]|1[0-5])$/.test(slot))throw Error('INVALID_TAB_SESSION');
 return Object.freeze({slot,appName:'waraqa-tab-session-'+slot});
}
export function initializeBrowserSession({href,config,appSdk,authSdk,storage}){
 const spec=tabSessionSpec(href);
 if(!spec){const app=appSdk.initializeApp(config);return{app,auth:authSdk.getAuth(app),spec:null};}
 if(!storage||!authSdk.browserSessionPersistence||!authSdk.initializeAuth)throw Error('TAB_SESSION_STORAGE_REQUIRED');
 const key='waraqa-tab-session-probe',before=storage.getItem(key);
 try{storage.setItem(key,spec.slot);if(storage.getItem(key)!==spec.slot)throw Error('storage');}
 finally{before===null?storage.removeItem(key):storage.setItem(key,before);}
 const app=appSdk.initializeApp(config,spec.appName);
 // Never setPersistence on the default app: that could sign out normal tabs.
 const auth=authSdk.initializeAuth(app,{persistence:authSdk.browserSessionPersistence});
 return {app,auth,spec};
}
