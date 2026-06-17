const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let mainWindow;
let db;

function crearVentana() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 750,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('html/index.html');
}

app.whenReady().then(() => {
    // Inicializar base de datos
    db = new Database(path.join(app.getPath('userData'), 'pos.db'));

    db.exec(`
        CREATE TABLE IF NOT EXISTS productos (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre          TEXT NOT NULL,
            precio_compra   REAL NOT NULL,
            precio_venta    REAL NOT NULL,
            cantidad        INTEGER NOT NULL
        )
    `);

    crearVentana();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) crearVentana();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Handler IPC
ipcMain.handle('guardar-producto', (event, datos) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO productos (nombre, precio_compra, precio_venta, cantidad)
            VALUES (?, ?, ?, ?)
        `);
        const info = stmt.run(datos.nombre, datos.precioCompra, datos.precioVenta, datos.cantidad);
        return { ok: true, id: info.lastInsertRowid };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});
// Handler IPC - leer productos
ipcMain.handle('obtener-productos', () => {
    try {
        const rows = db.prepare('SELECT * FROM productos ORDER BY id DESC').all();
        return { ok: true, data: rows };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});
ipcMain.handle('actualizar-cantidad', (event, { id, cantidad }) => {
    try {
        db.prepare('UPDATE productos SET cantidad = ? WHERE id = ?').run(cantidad, id);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});