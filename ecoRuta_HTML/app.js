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

    // 4. Mapa interactivo de la página "Puntos de reciclaje" 
    const contenedorMapa = document.getElementById('mapa');

    if (contenedorMapa && typeof L !== 'undefined') {

        const info = document.getElementById('mapa-info');
        const tarjetas = Array.from(document.querySelectorAll('.punto'));
        const marcadores = new Map(); // tarjeta -> marcador

        // Mapa centrado en un punto de ejemplo 
        const mapa = L.map('mapa').setView([4.5339, -75.6811], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; Colaboradores de OpenStreetMap'
        }).addTo(mapa);

        // Un marcador por cada tarjeta, con sus coordenadas (data-lat / data-lng)
        tarjetas.forEach((tarjeta) => {
            const lat = parseFloat(tarjeta.dataset.lat);
            const lng = parseFloat(tarjeta.dataset.lng);
            const titulo = tarjeta.querySelector('h2').textContent;
            const direccion = tarjeta.querySelectorAll('p')[1].textContent.trim();

            const popup = document.createElement('div');
            const negrita = document.createElement('strong');
            negrita.textContent = titulo;
            popup.append(negrita, document.createElement('br'), direccion);

            const marcador = L.marker([lat, lng]).addTo(mapa).bindPopup(popup);
            marcadores.set(tarjeta, marcador);

            // Clic en el marcador, resalta la tarjeta
            marcador.on('click', () => seleccionar(tarjeta, false));

            // Clic en la tarjeta ver detalle, vuela al marcador
            tarjeta.addEventListener('click', (evento) => {
                if (evento.target.closest('a')) evento.preventDefault();
                seleccionar(tarjeta, true);
            });
        });

        function seleccionar(tarjeta, volar) {
            tarjetas.forEach((t) => t.classList.remove('seleccionado'));
            tarjeta.classList.add('seleccionado');

            const marcador = marcadores.get(tarjeta);

            if (volar) {
                contenedorMapa.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                mapa.flyTo(marcador.getLatLng(), 16);
                marcador.openPopup();
            } else {
                tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // Filtros por material: ocultan tarjetas y marcadores
        const botonesMaterial = document.querySelectorAll('.filtros button');

        botonesMaterial.forEach((boton) => {
            boton.addEventListener('click', () => {
                const filtro = boton.dataset.filtro;
                const visibles = [];

                tarjetas.forEach((tarjeta) => {
                    const materiales = tarjeta.dataset.materiales.split(' ');
                    const coincide = filtro === 'todo' || materiales.includes(filtro);
                    const marcador = marcadores.get(tarjeta);

                    tarjeta.hidden = !coincide;
                    tarjeta.classList.remove('seleccionado');

                    if (coincide) {
                        marcador.addTo(mapa);
                        visibles.push(marcador.getLatLng());
                    } else {
                        marcador.remove();
                    }
                });

                if (visibles.length > 0) {
                    mapa.flyToBounds(L.latLngBounds(visibles), { padding: [50, 50], maxZoom: 15 });
                    info.textContent = visibles.length + ' punto(s) encontrado(s).';
                } else {
                    info.textContent = 'No hay puntos para este material todavía.';
                }
            });
        });

        // Botón "Cerca de mí", usa la ubicación del usuario y busca el punto más cercano
        let marcadorUsuario = null;

        document.getElementById('btn-ubicacion').addEventListener('click', () => {
            if (!navigator.geolocation) {
                info.textContent = 'Tu navegador no permite obtener la ubicación.';
                return;
            }

            info.textContent = 'Buscando tu ubicación...';

            navigator.geolocation.getCurrentPosition(
                (posicion) => {
                    const usuario = L.latLng(posicion.coords.latitude, posicion.coords.longitude);

                    if (marcadorUsuario) marcadorUsuario.remove();
                    marcadorUsuario = L.circleMarker(usuario, {
                        radius: 9, color: '#1b4332', fillColor: '#a5d0b9', fillOpacity: 1
                    }).addTo(mapa).bindPopup('Tú estás aquí');

                    // Punto visible más cercano
                    let masCercana = null;
                    let distanciaMin = Infinity;

                    tarjetas.forEach((tarjeta) => {
                        if (tarjeta.hidden) return;
                        const distancia = mapa.distance(usuario, marcadores.get(tarjeta).getLatLng());
                        if (distancia < distanciaMin) {
                            distanciaMin = distancia;
                            masCercana = tarjeta;
                        }
                    });

                    if (!masCercana) {
                        mapa.flyTo(usuario, 15);
                        info.textContent = 'No hay puntos visibles para comparar.';
                        return;
                    }

                    const nombre = masCercana.querySelector('h2').textContent;
                    const km = (distanciaMin / 1000).toFixed(1);
                    info.textContent = 'El punto más cercano es ' + nombre + ' (a ' + km + ' km).';

                    mapa.fitBounds(L.latLngBounds([usuario, marcadores.get(masCercana).getLatLng()]), { padding: [60, 60] });
                    seleccionar(masCercana, false);
                    marcadores.get(masCercana).openPopup();
                },
                () => {
                    info.textContent = 'No pudimos obtener tu ubicación. Revisa los permisos del navegador.';
                }
            );
        });
    }

});
