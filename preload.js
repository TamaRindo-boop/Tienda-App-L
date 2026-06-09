const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    guardarProducto: (datos) => ipcRenderer.invoke('guardar-producto', datos),
    obtenerProductos: ()      => ipcRenderer.invoke('obtener-productos')
});

actualizarCantidad: (datos) => ipcRenderer.invoke('actualizar-cantidad', datos)