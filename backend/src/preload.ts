import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('get-sources'),

  onSourcesResponse: (callback: (sources: any[]) => void) => {
    ipcRenderer.removeAllListeners('get-sources-response');
    ipcRenderer.on('get-sources-response', (_event, sources) => callback(sources));
  },

  selectSource: (sourceId: string) => {
    ipcRenderer.send('select-source', sourceId);
  },

  // ── NEW: send a control action to main process for robot execution ──────
  sendControlAction: (action: object) => {
    ipcRenderer.send('remote-control', action);
  },

  // Add this
    saveRecording: (data: number[], mimeType: string) => {
        ipcRenderer.send('save-recording', { data, mimeType });
    },
});