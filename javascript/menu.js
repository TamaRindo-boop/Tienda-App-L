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
            links.forEach(a => a.classList.remove('activo')); // ← Cambiar 'active' por 'activo'
            
            const path = window.location.pathname;
            const paginaActual = path.split('/').pop() || 'dashboard.html';
            
            const linkActivo = [...links].find(a => {
                const href = a.getAttribute('href');
                return href && href.includes(paginaActual);
            });
            
            if (linkActivo) {
                linkActivo.classList.add('activo'); // ← Cambiar 'active' por 'activo'
            }

            // Evento para el botón "+"
            const btnMenu = document.getElementById('btn-nuevo-producto');
            if (btnMenu) {
                btnMenu.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof window.abrirModal === 'function') {
                        window.abrirModal();
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