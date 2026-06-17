function anularVenta(id) {
    if (!confirm("¿Anular esta venta? Esto no revertirá el stock automáticamente.")) return;
    
    const index = ventas.findIndex(v => v.id === id);
    if (index !== -1) {
        ventas[index].estado = "Anulado";
        localStorage.setItem("ventas", JSON.stringify(ventas));
        renderizarVentas();
        actualizarResumen();
        alert("✅ Venta anulada");
    }
}