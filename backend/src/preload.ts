import {contextBridge, ipcMain, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getSources: () => ipcRenderer.invoke('get-sources'),
});
