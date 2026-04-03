// // import { app, BrowserWindow, desktopCapturer } from 'electron';
// // import path from 'path';

// // //Options added for testing screen share
// // app.disableHardwareAcceleration();
// // //app.commandLine.appendSwitch('ignore-certificate-errors');
// // //app.commandLine.appendSwitch('allow-insecure-localhost', 'true');

// // const isProd = process.env.NODE_ENV === 'production';

// // let mainWindow: BrowserWindow | null = null;

// // async function createWindow() {
// //   mainWindow = new BrowserWindow({
// //     width: 1280,
// //     height: 720,
// //     webPreferences: {
// //       nodeIntegration: true,
// //       contextIsolation: true,
// //       preload: path.join(__dirname, 'preload.js'),
// //     },
// //   });

// //   mainWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
// //   	  //This autpmatically selects the primary screen to share
// //   	  if (sources.length>0) {
// //   	  	  callback({video:sources[0], audio: 'loopback' });
// // 	  }
// //   }).catch((err) => {
// //   	  console.error("Failed to capture screen: ", err);
// //   }});
// //   });
// //   // --- 🔴 THE FIX: Force Trust for WSS ---
// //   // This intercepts the certificate check for the specific window session
// //   // and returns '0' (OK) to bypass the error.
// //   mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
// //     callback(0); // 0 = Verified/Success
// //   });
// //   // --------------------------------------

// //   if (isProd) {
// //     await mainWindow.loadURL(`file://${__dirname}/../renderer/out/index.html`);
// //   } else {
// // //    const port = process.argv[2];
// //     await mainWindow.loadURL(`http://localhost:5173`);
// //     mainWindow.webContents.openDevTools();
// //   }
// // }

// // app.on('ready', () => {
// //   createWindow();
// // });

// // app.on('window-all-closed', () => {
// //   if (process.platform !== 'darwin') {
// //     app.quit();
// //   }
// // });




// import { app, BrowserWindow, desktopCapturer, ipcMain } from 'electron';
// import path from 'path';

// // Options added for stability during screen capture
// app.disableHardwareAcceleration();

// const isProd = process.env.NODE_ENV === 'production';
// let mainWindow: BrowserWindow | null = null;

// async function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1280,
//     height: 720,
//     webPreferences: {
//       nodeIntegration: false, // Security best practice
//       contextIsolation: true, // Required for contextBridge
//       preload: path.join(__dirname, 'preload.js'),
//     },
//   });

//   // --- 🎥 1. Media Request Handler ---
//   // This allows the 'navigator.mediaDevices.getDisplayMedia' call to work in Electron
//   mainWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
//     desktopCapturer.getSources({types: ['screen', 'window']}).then((sources) => {
//       mainWindow!.webContents.send('get-sources-response',
//         sources.map(s => ({id: s.id, name: s.name, thumbnail: s.thumbnail.toDataURL() }))
//       );
//     });
//   });

//   // --- 🔒 2. Trust for WSS (DuckDNS) ---
//   // Ensures the WebSocket handshake isn't killed by certificate verification delays
//   mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
//     const { hostname } = request;
//     if (hostname === 'rda-signaling.duckdns.org') {
//       callback(0); // 0 = Verified/Success
//     } else {
//       callback(-2); // -2 = Use default verification
//     }
//   });

//   // --- 📡 3. IPC Handler for Preload ---
//   // This listens for 'get-sources' calls from your React frontend via preload.js
//   ipcMain.handle('get-sources', async () => {
//     const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
//     return sources.map(source => ({
//       id: source.id,
//       name: source.name,
//       thumbnail: source.thumbnail.toDataURL(),
//     }));
//   });

//   // --- 🌐 4. Load Application ---
//   if (isProd) {
//     // Path for packaged app
//     await mainWindow.loadURL(`file://${path.join(__dirname, '../renderer/out/index.html')}`);
//   } else {
//     // Path for development (Vite/React)
//     await mainWindow.loadURL(`http://localhost:5173`);
//     mainWindow.webContents.openDevTools();
//   }
// }

// // App Lifecycle
// app.on('ready', createWindow);

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });






import { app, BrowserWindow, desktopCapturer, ipcMain } from 'electron';
import path from 'path';

app.disableHardwareAcceleration();

const isProd = process.env.NODE_ENV === 'production';
let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // --- 🎥 1. Media Request Handler ---
  // Stores the callback so we can call it after user picks a source
  let pendingCallback: ((streams: any) => void) | null = null;

  mainWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      // Store callback for later when user picks a source
      pendingCallback = callback;
      // Send sources to renderer so user can pick
      mainWindow!.webContents.send(
        'get-sources-response',
        sources.map(s => ({
          id: s.id,
          name: s.name,
          thumbnail: s.thumbnail.toDataURL(),
        }))
      );
    });
  });

  // When renderer sends back the chosen source id, call the pending callback
  ipcMain.on('select-source', (_event, sourceId: string) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      const selected = sources.find(s => s.id === sourceId);
      if (selected && pendingCallback) {
        pendingCallback({ video: selected, audio: 'loopback' }); // ← this completes getDisplayMedia
        pendingCallback = null;
      }
    });
  });

  // --- 🔒 2. Trust for WSS ---
  mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
    const { hostname } = request;
    if (hostname === 'rda-signaling.duckdns.org') {
      callback(0);
    } else {
      callback(-2);
    }
  });

  // --- 📡 3. IPC Handler for get-sources (kept for compatibility) ---
  ipcMain.handle('get-sources', async () => {
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
    }));
  });

  // --- 🌐 4. Load Application ---
  if (isProd) {
    await mainWindow.loadURL(`file://${path.join(__dirname, '../renderer/out/index.html')}`);
  } else {
    await mainWindow.loadURL(`http://localhost:5173`);
    mainWindow.webContents.openDevTools();
  }
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});