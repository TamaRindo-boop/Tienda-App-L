// menu.js
async function cargarMenu() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) {
        console.error("❌ No se encontró el contenedor del menú");
        return;
    }

    try {
        const res = await fetch('../html/menu.html');
        
        if (res.ok) {
            const html = await res.text();
            menuContainer.innerHTML = html;
            
            // Activar el enlace según la página actual
            const links = document.querySelectorAll('.sidebar nav a');
            
            // Obtener la página actual
            const path = window.location.pathname;
            const paginaActual = path.split('/').pop() || 'dashboard.html';
            
            // Buscar y activar el link correspondiente
            let linkEncontrado = false;
            links.forEach(a => {
                const href = a.getAttribute('href');
                if (href && href.includes(paginaActual)) {
                    a.classList.add('active');
                    linkEncontrado = true;
                } else {
                    a.classList.remove('active');
                }
            });
            
            // Si no se encontró, activar dashboard por defecto
            if (!linkEncontrado) {
                const dashLink = document.querySelector('.sidebar nav a[href="dashboard.html"]');
                if (dashLink) dashLink.classList.add('active');
            }

            // Evento para el botón "+" en el menú
            const btnMenu = document.getElementById('btn-nuevo-producto');
            if (btnMenu) {
                btnMenu.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Navegar a productos y abrir modal
                    if (window.location.pathname.includes('productos.html')) {
                        if (typeof window.abrirModal === 'function') {
                            window.abrirModal();
                        }
                    } else {
                        window.location.href = 'productos.html?action=nuevo';
                    }
                });
            }
            
            console.log("✅ Menú cargado correctamente");
            
        } else {
            console.error("❌ Error al cargar el menú:", res.status, res.statusText);
        }
    } catch (error) {
        console.error("❌ Error en cargarMenu:", error);
    }
}

document.addEventListener('DOMContentLoaded', cargarMenu);