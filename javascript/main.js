const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');
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

function inicializarDB() {
    const dbPath = path.join(app.getPath('userData'), 'pos.db');
    db = new Database(dbPath);

    db.exec(`
        CREATE TABLE IF NOT EXISTS productos (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre        TEXT NOT NULL,
            precio_compra REAL NOT NULL DEFAULT 0,
            precio_venta  REAL NOT NULL DEFAULT 0,
            cantidad      INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS ventas (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha           TEXT NOT NULL,
            producto_id     INTEGER NOT NULL,
            producto_nombre TEXT NOT NULL,
            cantidad        INTEGER NOT NULL,
            precio_unitario REAL NOT NULL,
            total           REAL NOT NULL,
            estado          TEXT NOT NULL DEFAULT 'Pagado',
            FOREIGN KEY (producto_id) REFERENCES productos(id)
        );

        CREATE TABLE IF NOT EXISTS compras (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha           TEXT NOT NULL,
            producto_id     INTEGER NOT NULL,
            producto_nombre TEXT NOT NULL,
            cantidad        INTEGER NOT NULL,
            precio_unitario REAL NOT NULL,
            estado          TEXT NOT NULL DEFAULT 'Pendiente',
            FOREIGN KEY (producto_id) REFERENCES productos(id)
        );

        CREATE TABLE IF NOT EXISTS movimientos (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha           TEXT NOT NULL,
            tipo            TEXT NOT NULL,
            producto_id     INTEGER,
            producto_nombre TEXT NOT NULL,
            referencia      TEXT,
            cantidad        INTEGER NOT NULL,
            usuario         TEXT NOT NULL DEFAULT 'Administrador'
        );
    `);

    // ── Migraciones ──────────────────────────────────────────
    try {
        // 1. Quitar proveedor de compras si existe
        const colsCompras = db.prepare("PRAGMA table_info(compras)").all();
        if (colsCompras.some(c => c.name === 'proveedor')) {
            db.exec(`
                BEGIN TRANSACTION;
                CREATE TABLE compras_nueva (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    fecha           TEXT NOT NULL,
                    producto_id     INTEGER NOT NULL,
                    producto_nombre TEXT NOT NULL,
                    cantidad        INTEGER NOT NULL,
                    precio_unitario REAL NOT NULL,
                    estado          TEXT NOT NULL DEFAULT 'Pendiente'
                );
                INSERT INTO compras_nueva (id, fecha, producto_id, producto_nombre, cantidad, precio_unitario, estado)
                SELECT id, fecha, producto_id, producto_nombre, cantidad, precio_unitario, estado FROM compras;
                DROP TABLE compras;
                ALTER TABLE compras_nueva RENAME TO compras;
                COMMIT;
            `);
            console.log('✅ Migración: proveedor eliminado de compras');
        }

        // 2. Quitar cliente y metodo_pago de ventas si existen
        const colsVentas = db.prepare("PRAGMA table_info(ventas)").all();
        if (colsVentas.some(c => c.name === 'cliente')) {
            db.exec(`
                BEGIN TRANSACTION;
                CREATE TABLE ventas_nueva (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    fecha           TEXT NOT NULL,
                    producto_id     INTEGER NOT NULL,
                    producto_nombre TEXT NOT NULL,
                    cantidad        INTEGER NOT NULL,
                    precio_unitario REAL NOT NULL,
                    total           REAL NOT NULL,
                    estado          TEXT NOT NULL DEFAULT 'Pagado'
                );
                INSERT INTO ventas_nueva (id, fecha, producto_id, producto_nombre, cantidad, precio_unitario, total, estado)
                SELECT id, fecha, producto_id, producto_nombre, cantidad, precio_unitario, total, estado FROM ventas;
                DROP TABLE ventas;
                ALTER TABLE ventas_nueva RENAME TO ventas;
                COMMIT;
            `);
            console.log('✅ Migración: cliente/metodo_pago eliminados de ventas');
        }
    } catch (err) {
        console.error('Error en migración:', err.message);
    }

    console.log('✅ DB inicializada en:', dbPath);
}

// ── App lifecycle ────────────────────────────────────────────
app.whenReady().then(() => {
    inicializarDB();
    crearVentana();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) crearVentana();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ── IPC: Productos ───────────────────────────────────────────
ipcMain.handle('obtener-productos', () => {
    try {
        const rows = db.prepare('SELECT * FROM productos ORDER BY nombre ASC').all();
        return { ok: true, data: rows };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('guardar-producto', (_, datos) => {
    try {
        const info = db.prepare(
            'INSERT INTO productos (nombre, precio_compra, precio_venta, cantidad) VALUES (?, ?, ?, ?)'
        ).run(datos.nombre, datos.precioCompra, datos.precioVenta, datos.cantidad);
        return { ok: true, id: info.lastInsertRowid };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('actualizar-cantidad', (_, { id, cantidad }) => {
    try {
        db.prepare('UPDATE productos SET cantidad = ? WHERE id = ?').run(cantidad, id);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

// ── IPC: Ventas ──────────────────────────────────────────────
ipcMain.handle('obtener-ventas', () => {
    try {
        const rows = db.prepare('SELECT * FROM ventas ORDER BY id DESC').all();
        return { ok: true, data: rows };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('guardar-venta', (_, datos) => {
    try {
        const prod = db.prepare('SELECT cantidad, precio_venta FROM productos WHERE id = ?').get(datos.productoId);
        if (!prod) return { ok: false, error: 'Producto no encontrado' };
        if (prod.cantidad < datos.cantidad) {
            return { ok: false, error: `Stock insuficiente (disponible: ${prod.cantidad})` };
        }

        const precioUnitario = prod.precio_venta;
        const total          = precioUnitario * datos.cantidad;

        const info = db.prepare(`
            INSERT INTO ventas (fecha, producto_id, producto_nombre, cantidad, precio_unitario, total, estado)
            VALUES (?, ?, ?, ?, ?, ?, 'Pagado')
        `).run(
            new Date().toISOString(),
            datos.productoId,
            datos.productoNombre,
            datos.cantidad,
            precioUnitario,
            total
        );

        db.prepare('UPDATE productos SET cantidad = cantidad - ? WHERE id = ?')
          .run(datos.cantidad, datos.productoId);

        return { ok: true, id: info.lastInsertRowid };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('anular-venta', (_, { id }) => {
    try {
        db.prepare("UPDATE ventas SET estado = 'Anulado' WHERE id = ?").run(id);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

// ── IPC: Compras ─────────────────────────────────────────────
ipcMain.handle('obtener-compras', () => {
    try {
        const rows = db.prepare('SELECT * FROM compras ORDER BY id DESC').all();
        return { ok: true, data: rows };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('guardar-compra', (_, datos) => {
    try {
        const prod = db.prepare('SELECT nombre, precio_compra FROM productos WHERE id = ?').get(datos.productoId);
        if (!prod) return { ok: false, error: 'Producto no encontrado' };

        const info = db.prepare(`
            INSERT INTO compras (fecha, producto_id, producto_nombre, cantidad, precio_unitario, estado)
            VALUES (?, ?, ?, ?, ?, 'Pendiente')
        `).run(
            new Date().toISOString(),
            datos.productoId,
            prod.nombre,
            datos.cantidad,
            prod.precio_compra
        );
        return { ok: true, id: info.lastInsertRowid };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('completar-compra', (_, { id }) => {
    try {
        const compra = db.prepare('SELECT * FROM compras WHERE id = ?').get(id);
        if (!compra) return { ok: false, error: 'Compra no encontrada' };
        if (compra.estado !== 'Pendiente') return { ok: false, error: 'La compra ya fue procesada' };

        db.prepare("UPDATE compras SET estado = 'Completada' WHERE id = ?").run(id);
        db.prepare('UPDATE productos SET cantidad = cantidad + ? WHERE id = ?')
          .run(compra.cantidad, compra.producto_id);

        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('cancelar-compra', (_, { id }) => {
    try {
        db.prepare("UPDATE compras SET estado = 'Cancelada' WHERE id = ?").run(id);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('eliminar-compra', (_, { id }) => {
    try {
        db.prepare('DELETE FROM compras WHERE id = ?').run(id);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

// ── IPC: Movimientos ─────────────────────────────────────────
ipcMain.handle('obtener-movimientos', () => {
    try {
        const rows = db.prepare('SELECT * FROM movimientos ORDER BY id DESC').all();
        return { ok: true, data: rows };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('guardar-movimiento', (_, datos) => {
    try {
        const productoId = parseInt(datos.productoId);
        const cantidad   = parseInt(datos.cantidad);

        const prod = db.prepare('SELECT * FROM productos WHERE id = ?').get(productoId);
        if (!prod) return { ok: false, error: 'Producto no encontrado' };

        if (datos.tipo === 'Salida' && prod.cantidad < cantidad) {
            return { ok: false, error: `Stock insuficiente (disponible: ${prod.cantidad})` };
        }

        // Guardar el movimiento
        db.prepare(`
            INSERT INTO movimientos (fecha, tipo, producto_id, producto_nombre, referencia, cantidad, usuario)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            new Date().toISOString(),
            datos.tipo,
            prod.id,
            prod.nombre,
            datos.referencia || `REF-${Date.now().toString().slice(-6)}`,
            cantidad,
            'Administrador'
        );

        // Actualizar stock según tipo
        if (datos.tipo === 'Entrada') {
            db.prepare('UPDATE productos SET cantidad = cantidad + ? WHERE id = ?').run(cantidad, prod.id);
        } else if (datos.tipo === 'Salida') {
            db.prepare('UPDATE productos SET cantidad = cantidad - ? WHERE id = ?').run(cantidad, prod.id);
        } else if (datos.tipo === 'Ajuste') {
            // Ajuste establece la cantidad exacta ingresada
            db.prepare('UPDATE productos SET cantidad = ? WHERE id = ?').run(cantidad, prod.id);
        }

        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('eliminar-movimiento', (_, { id }) => {
    try {
        db.prepare('DELETE FROM movimientos WHERE id = ?').run(id);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

// ── IPC: Exportar ────────────────────────────────────────────
ipcMain.handle('exportar-pdf', async (_, { contenido }) => {
    try {
        const desktop = app.getPath('desktop');
        const fecha   = new Date().toISOString().slice(0, 10);
        const archivo = path.join(desktop, `Reporte-Tiendita-${fecha}.html`);

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte Tiendita ${fecha}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
  h1   { color: #2563eb; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background: #0f172a; color: white; padding: 10px 14px; text-align: left; font-size: 13px; }
  td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  tr:nth-child(even) { background: #f8fafc; }
  .footer { margin-top: 30px; font-size: 12px; color: #6b7280; }
</style>
</head>
<body>
<h1>📊 Reporte Tiendita</h1>
<p>Generado el ${new Date().toLocaleString('es-MX')}</p>
${contenido}
<div class="footer">Tiendita POS — Exportado automáticamente</div>
</body>
</html>`;

        fs.writeFileSync(archivo, html, 'utf8');
        return { ok: true, ruta: archivo };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('exportar-csv', async (_, { filas, columnas, nombre }) => {
    try {
        const desktop = app.getPath('desktop');
        const fecha   = new Date().toISOString().slice(0, 10);
        const archivo = path.join(desktop, `${nombre}-${fecha}.csv`);

        const encabezado = columnas.join(',');
        const cuerpo = filas.map(fila =>
            columnas.map(col => {
                const val = String(fila[col] ?? '').replace(/"/g, '""');
                return `"${val}"`;
            }).join(',')
        ).join('\n');

        fs.writeFileSync(archivo, '\uFEFF' + encabezado + '\n' + cuerpo, 'utf8');
        return { ok: true, ruta: archivo };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});