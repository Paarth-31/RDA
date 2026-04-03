// import { contextBridge, ipcRenderer } from 'electron';

// contextBridge.exposeInMainWorld('electronAPI', {
//     getSources: () => ipcRenderer.invoke('get-sources'),
//     onSourcesResponse: (callback: (sources: any[]) => void) => {
//         ipcRenderer.on('get-sources-response', (_event, sources) => callback(sources));
//     },
//     selectSource: (sourceId: string) => {
//         ipcRenderer.send('select-source', sourceId);
//     },
// });



import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getSources: () => ipcRenderer.invoke('get-sources'),
    onSourcesResponse: (callback: (sources: any[]) => void) => {
        // Remove any existing listener before adding new one
        ipcRenderer.removeAllListeners('get-sources-response');
        ipcRenderer.on('get-sources-response', (_event, sources) => callback(sources));
    },
    selectSource: (sourceId: string) => {
        ipcRenderer.send('select-source', sourceId);
    },
});