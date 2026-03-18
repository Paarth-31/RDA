import { app, BrowserWindow } from 'electron';
import path from 'path';

//Options added for testing screen share
app.disableHardwareAcceleration();
//app.commandLine.appendSwitch('ignore-certificate-errors');
//app.commandLine.appendSwitch('allow-insecure-localhost', 'true');

const isProd = process.env.NODE_ENV === 'production';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
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
