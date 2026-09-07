// app.js — EcoRuta
// Comportamiento básico compartido por todas las páginas.

document.addEventListener('DOMContentLoaded', () => {

    // 1. Resaltar el enlace del menú que corresponde a la página actual
    const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
    const enlacesMenu = document.querySelectorAll('header nav div a');

    enlacesMenu.forEach((enlace) => {
        if (enlace.getAttribute('href') === paginaActual) {
            enlace.classList.add('activo');
        }
    });

    // 2. Confirmar el envío de cualquier formulario (todavía no hay backend)
    const formularios = document.querySelectorAll('form');

    formularios.forEach((formulario) => {
        formulario.addEventListener('submit', (evento) => {
            evento.preventDefault();
            alert('¡Gracias! Tu formulario se envió correctamente.');
            formulario.reset();
        });
    });

    // 3. Filtros de la página "Puntos de reciclaje": marcar el botón activo
    const botonesFiltro = document.querySelectorAll('.filtros button');

    botonesFiltro.forEach((boton) => {
        boton.addEventListener('click', () => {
            botonesFiltro.forEach((b) => b.classList.remove('activo'));
            boton.classList.add('activo');
        });
    });

});
