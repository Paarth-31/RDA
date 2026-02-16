import { app, BrowserWindow } from 'electron';
import path from 'path';

//Options added for testing screen share
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-insecure-localhost', 'true');
// --- ADD THIS BLOCK: The Nuclear Option for WSS ---
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // On certificate error we disable default behaviour (block connection)
  // and call callback(true) to instruct electron to allow the connection
  if (url.startsWith('wss://localhost') || url.startsWith('https://localhost')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
//

const isProd = process.env.NODE_ENV === 'production';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  // --- 🔴 THE FIX: Force Trust for WSS ---
  // This intercepts the certificate check for the specific window session
  // and returns '0' (OK) to bypass the error.
  mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
    callback(0); // 0 = Verified/Success
  });
  // --------------------------------------

  if (isProd) {
    await mainWindow.loadURL(`file://${__dirname}/../renderer/out/index.html`);
  } else {
//    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:5173`);
    mainWindow.webContents.openDevTools();
  }
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
