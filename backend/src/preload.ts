// import { contextBridge, ipcRenderer } from 'electron';

// contextBridge.exposeInMainWorld('electronAPI', {
//   getSources: () => ipcRenderer.invoke('get-sources'),

//   onSourcesResponse: (callback: (sources: any[]) => void) => {
//     ipcRenderer.removeAllListeners('get-sources-response');
//     ipcRenderer.on('get-sources-response', (_event, sources) => callback(sources));
//   },

//   selectSource: (sourceId: string) => {
//     ipcRenderer.send('select-source', sourceId);
//   },

//   // ── NEW: send a control action to main process for robot execution ──────
//   sendControlAction: (action: object) => {
//     ipcRenderer.send('remote-control', action);
//   },

//   // Add this
//     saveRecording: (data: number[], mimeType: string) => {
//         ipcRenderer.send('save-recording', { data, mimeType });
//     },
// });


import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Screen capture
  getSources: () => ipcRenderer.invoke('get-sources'),

  onSourcesResponse: (callback: (sources: any[]) => void) => {
    ipcRenderer.removeAllListeners('get-sources-response');
    ipcRenderer.on('get-sources-response', (_event, sources) => callback(sources));
  },

  selectSource: (sourceId: string) => {
    ipcRenderer.send('select-source', sourceId);
  },

  // Remote control forwarding to robot.js in main process
  sendControlAction: (action: object) => {
    ipcRenderer.send('remote-control', action);
  },

  // Save a new recording (called from useRecording hook)
  saveRecording: (data: number[], mimeType: string) => {
    ipcRenderer.send('save-recording', { data, mimeType });
  },

  // List saved recordings from disk
  listRecordings: () => ipcRenderer.invoke('list-recordings'),

  // Open a recording in the system's default player
  openFile: (filePath: string) => {
    ipcRenderer.send('open-file', filePath);
  },

  // Export/copy a recording to a user-chosen location
  exportRecording: (filePath: string) => {
    ipcRenderer.send('export-recording', filePath);
  },

  // Delete a recording from disk
  deleteRecording: (filePath: string) => ipcRenderer.invoke('delete-recording', filePath),
});