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

  let pendingCallback: ((streams: any) => void) | null = null;

  // ── Screen capture handler — now passes audio:'loopback' ─────────────────
  // 'loopback' tells Chromium/Electron to capture system audio alongside video.
  // On Windows this works natively. On Linux you may need PulseAudio loopback.
  // On macOS system audio capture requires a virtual audio driver (e.g. BlackHole).
  mainWindow.webContents.session.setDisplayMediaRequestHandler(
    (_request, callback) => {
      desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
        pendingCallback = callback;
        mainWindow!.webContents.send(
          'get-sources-response',
          sources.map((s) => ({
            id: s.id,
            name: s.name,
            thumbnail: s.thumbnail.toDataURL(),
          }))
        );
      });
    },
  );

  ipcMain.on('select-source', (_event, sourceId: string) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      const selected = sources.find((s) => s.id === sourceId);
      if (selected && pendingCallback) {
        // audio: 'loopback' → captures system audio output (what you hear)
        pendingCallback({ video: selected, audio: 'loopback' });
        pendingCallback = null;
      }
    });
  });

  // ── Trust our own signaling server's self-signed cert ───────────────────
  mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
    if (request.hostname === 'rda-signaling.duckdns.org') {
      callback(0); // 0 = trust
    } else {
      callback(-2); // -2 = reject
    }
  });

  // ── IPC: get sources list (kept for compatibility) ───────────────────────
  ipcMain.handle('get-sources', async () => {
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
    }));
  });

  // ── IPC: robot.js mouse/keyboard forwarding ──────────────────────────────
  // The renderer sends control events; main process executes them via robotjs.
  // robotjs must be installed: npm install @jitsi/robotjs (Electron-compatible fork)
  // If not installed, control events are silently ignored.
  ipcMain.on('remote-control', (_event, action: RemoteControlAction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const robot = require('@jitsi/robotjs');
      executeControlAction(robot, action);
    } catch {
      // robotjs not installed — control feature silently unavailable
    }
  });

  if (isProd) {
    await mainWindow.loadURL(`file://${path.join(__dirname, '../renderer/out/index.html')}`);
  } else {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }
}

// ── Control action types ─────────────────────────────────────────────────────
interface RemoteControlAction {
  type: 'mousemove' | 'mousedown' | 'mouseup' | 'click' | 'scroll' | 'keydown' | 'keyup' | 'type';
  x?: number;
  y?: number;
  button?: 'left' | 'right' | 'middle';
  key?: string;
  text?: string;
  scrollX?: number;
  scrollY?: number;
  // Normalised coordinates 0-1 so sender doesn't need to know target resolution
  normX?: number;
  normY?: number;
}

function executeControlAction(robot: any, action: RemoteControlAction) {
  const screenSize = robot.getScreenSize();

  // Convert normalised coords to absolute pixels
  const ax = action.normX != null
    ? Math.round(action.normX * screenSize.width)
    : action.x ?? 0;
  const ay = action.normY != null
    ? Math.round(action.normY * screenSize.height)
    : action.y ?? 0;

  switch (action.type) {
    case 'mousemove':
      robot.moveMouse(ax, ay);
      break;
    case 'mousedown':
      robot.moveMouse(ax, ay);
      robot.mouseToggle('down', action.button ?? 'left');
      break;
    case 'mouseup':
      robot.moveMouse(ax, ay);
      robot.mouseToggle('up', action.button ?? 'left');
      break;
    case 'click':
      robot.moveMouse(ax, ay);
      robot.mouseClick(action.button ?? 'left');
      break;
    case 'scroll':
      robot.scrollMouse(action.scrollX ?? 0, action.scrollY ?? 0);
      break;
    case 'keydown':
      if (action.key) robot.keyToggle(action.key, 'down');
      break;
    case 'keyup':
      if (action.key) robot.keyToggle(action.key, 'up');
      break;
    case 'type':
      if (action.text) robot.typeString(action.text);
      break;
  }
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});