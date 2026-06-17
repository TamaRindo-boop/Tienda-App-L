async function cargarMenu() {
    // Carga el contenido del menú desde un archivo externo
    const res = await fetch('../menu.html');
    if (res.ok) {
        document.getElementById('menu-container').innerHTML = await res.text();
        
        // Activa el enlace "Productos" en el menú lateral
        const links = document.querySelectorAll('.sidebar nav a');
        links.forEach(a => a.classList.remove('active'));
        const linkProductos = [...links].find(a => a.href.includes('productos.html'));
        if (linkProductos) linkProductos.classList.add('active');

        // Agrega un evento click al botón para abrir el modal de nuevo producto
        const btnMenu = document.getElementById('btn-nuevo-producto');
        if (btnMenu) btnMenu.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            abrirModal();
        });
    } else {
        console.error("Error al cargar el menú:", res.statusText);
    }
}

// Llama a la función cuando se carga la página
document.addEventListener('DOMContentLoaded', cargarMenu);