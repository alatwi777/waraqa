const { app, BrowserWindow, dialog } = require('electron');

const site = new URL('https://alatwi777.github.io/waraqa/');

function isWaraqa(url) {
  try {
    const destination = new URL(url);
    return destination.origin === site.origin && destination.pathname.startsWith(site.pathname);
  } catch {
    return false;
  }
}

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    title: 'ورقة',
    width: 1280,
    height: 850,
    autoHideMenuBar: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  });
  const contents = window.webContents;
  const restrictNavigation = (event, url) => {
    if (!isWaraqa(url)) event.preventDefault();
  };
  contents.on('will-navigate', restrictNavigation);
  contents.on('will-redirect', restrictNavigation);
  contents.setWindowOpenHandler(({ url }) => isWaraqa(url) || url === 'about:blank'
    ? { action: 'allow' }
    : { action: 'deny' });
  contents.session.setPermissionRequestHandler((requester, permission, respond, details) => {
    respond(permission === 'media' && isWaraqa(details.requestingUrl) && isWaraqa(requester.getURL()));
  });
  contents.session.setPermissionCheckHandler((requester, permission, origin, details) =>
    permission === 'media' && origin === site.origin && isWaraqa(details.requestingUrl || requester?.getURL()));
  try {
    await window.loadURL(site.href);
  } catch {
    dialog.showErrorBox('ورقة', 'تعذر فتح ورقة. تحقق من اتصال الإنترنت ثم افتح التطبيق مجددًا.');
    app.quit();
  }
});

app.on('window-all-closed', () => app.quit());
