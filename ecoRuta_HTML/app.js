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
        if (formulario.id === 'form-busqueda') return;

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

    // Puntos activos con los que trabajan las páginas (vienen de datos.js)
    const activos = obtenerActivos(puntos);

    // 4. Buscador del inicio (index.html): filtra el arreglo de puntos
    const formBusqueda = document.getElementById('form-busqueda');

    if (formBusqueda) {
        const panelResultados = document.getElementById('resultados-busqueda');
        const mensajeBusqueda = document.getElementById('mensaje-busqueda');
        const listaBusqueda = document.getElementById('lista-busqueda');

        formBusqueda.addEventListener('submit', function (evento) {
            evento.preventDefault();

            const material = document.getElementById('material').value;
            const ubicacion = document.getElementById('ubicacion').value;

            panelResultados.hidden = false;
            listaBusqueda.replaceChildren();

            if (material.trim() === '' && ubicacion.trim() === '') {
                mensajeBusqueda.textContent = 'Escribe un material o una ubicación para buscar.';
                return;
            }

            let resultado = buscarPorMaterial(activos, material);
            resultado = buscarPorUbicacion(resultado, ubicacion);

            if (resultado.length === 0) {
                mensajeBusqueda.textContent = 'No encontramos puntos con esos datos. Prueba con otro material.';
                return;
            }

            mensajeBusqueda.textContent = resultado.length + ' punto(s) encontrado(s).';

            resultado.forEach(function (punto) {
                const enlace = 'puntos-reciclaje.html?id=' + punto.id;
                listaBusqueda.appendChild(crearTarjeta(punto, 'Ver en el mapa', enlace));
            });

            panelResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // 5. Mapa y listado de la página "Puntos de reciclaje" (Leaflet + OpenStreetMap)
    const contenedorMapa = document.getElementById('mapa');
    const listaPuntos = document.getElementById('lista-puntos');

    if (contenedorMapa && listaPuntos) {

        const info = document.getElementById('mapa-info');
        const detalle = document.getElementById('detalle-punto');
        const mensajeVacio = document.getElementById('sin-resultados');
        const hayMapa = typeof L !== 'undefined';

        let mapa = null;
        const marcadores = new Map(); // id del punto -> marcador
        let visibles = [];            // puntos que se están mostrando ahora

        if (hayMapa) {
            mapa = L.map('mapa').setView([4.5339, -75.6811], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; Colaboradores de OpenStreetMap'
            }).addTo(mapa);

            // Un marcador por cada objeto del arreglo
            activos.forEach(function (punto) {
                const popup = document.createElement('div');
                const negrita = document.createElement('strong');
                negrita.textContent = punto.nombre;
                popup.append(negrita, document.createElement('br'), punto.direccion);

                const marcador = L.marker([punto.lat, punto.lng]).bindPopup(popup);
                marcador.on('click', function () {
                    seleccionar(punto, false);
                });
                marcadores.set(punto.id, marcador);
            });
        } else {
            info.textContent = 'No se pudo cargar el mapa (revisa tu conexión), pero el listado sigue disponible.';
        }

        // Muestra en el panel de detalle los datos de un punto
        function mostrarDetalle(punto) {
            const titulo = crearElemento('h3', punto.nombre);
            const direccion = crearElemento('p', 'Dirección: ' + punto.direccion);
            const horario = crearElemento('p', 'Horario: ' + punto.horario);
            const materiales = crearElemento('p', 'Materiales: ' + punto.materiales.join(', '));

            const comoLlegar = crearElemento('a', 'Cómo llegar');
            comoLlegar.href = 'https://www.google.com/maps/dir/?api=1&destination=' + punto.lat + ',' + punto.lng;
            comoLlegar.target = '_blank';
            comoLlegar.rel = 'noopener';

            detalle.replaceChildren(titulo, direccion, horario, materiales, comoLlegar);
            detalle.hidden = false;
        }

        // Resalta la tarjeta, muestra el detalle y (si hay mapa) enfoca el marcador
        function seleccionar(punto, volar) {
            listaPuntos.querySelectorAll('.punto').forEach(function (tarjeta) {
                tarjeta.classList.toggle('seleccionado', Number(tarjeta.dataset.id) === punto.id);
            });

            mostrarDetalle(punto);

            const tarjetaActual = listaPuntos.querySelector('.punto.seleccionado');

            if (volar && mapa) {
                contenedorMapa.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                mapa.flyTo([punto.lat, punto.lng], 16);
                marcadores.get(punto.id).openPopup();
            } else if (!volar && tarjetaActual) {
                tarjetaActual.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // Dibuja el listado y los marcadores según el filtro elegido
        function mostrarPuntos(filtro, animar) {
            visibles = filtrarPorCategoria(activos, filtro);

            listaPuntos.replaceChildren();
            detalle.hidden = true;

            if (mapa) {
                marcadores.forEach(function (marcador) {
                    marcador.remove();
                });
            }

            visibles.forEach(function (punto) {
                listaPuntos.appendChild(crearTarjeta(punto, 'Ver detalle', '#detalle-punto'));
                if (mapa) marcadores.get(punto.id).addTo(mapa);
            });

            mensajeVacio.hidden = visibles.length > 0;

            if (visibles.length > 0) {
                info.textContent = visibles.length + ' punto(s) encontrado(s). Toca un marcador o una tarjeta.';

                if (mapa) {
                    const coordenadas = visibles.map(function (punto) {
                        return [punto.lat, punto.lng];
                    });
                    const opciones = { padding: [50, 50], maxZoom: 15 };

                    if (animar) {
                        mapa.flyToBounds(coordenadas, opciones);
                    } else {
                        mapa.fitBounds(coordenadas, opciones);
                    }
                }
            } else {
                info.textContent = 'No hay puntos para este material todavía.';
            }
        }

        // Clic en una tarjeta -> buscar su objeto por id con find
        listaPuntos.addEventListener('click', function (evento) {
            const tarjeta = evento.target.closest('.punto');
            if (!tarjeta) return;

            if (evento.target.closest('a')) evento.preventDefault();

            const punto = buscarPorId(activos, Number(tarjeta.dataset.id));

            if (punto === undefined) {
                info.textContent = 'No se encontró ese punto.';
                return;
            }

            seleccionar(punto, true);
        });

        // Botones de filtro por material
        document.querySelectorAll('.filtros button').forEach(function (boton) {
            boton.addEventListener('click', function () {
                mostrarPuntos(boton.dataset.filtro, true);
            });
        });

        // Botón "Cerca de mí": distancia a cada punto visible y elige el menor
        let marcadorUsuario = null;

        document.getElementById('btn-ubicacion').addEventListener('click', function () {
            if (!mapa) {
                info.textContent = 'Necesitas el mapa cargado para usar esta opción.';
                return;
            }

            if (!navigator.geolocation) {
                info.textContent = 'Tu navegador no permite obtener la ubicación.';
                return;
            }

            if (visibles.length === 0) {
                info.textContent = 'No hay puntos visibles para comparar.';
                return;
            }

            info.textContent = 'Buscando tu ubicación...';

            navigator.geolocation.getCurrentPosition(
                function (posicion) {
                    const usuario = L.latLng(posicion.coords.latitude, posicion.coords.longitude);

                    if (marcadorUsuario) marcadorUsuario.remove();
                    marcadorUsuario = L.circleMarker(usuario, {
                        radius: 9, color: '#1b4332', fillColor: '#a5d0b9', fillOpacity: 1
                    }).addTo(mapa).bindPopup('Tú estás aquí');

                    // map: una distancia por cada punto visible
                    const distancias = visibles.map(function (punto) {
                        return { punto: punto, metros: mapa.distance(usuario, [punto.lat, punto.lng]) };
                    });

                    let masCercano = distancias[0];
                    distancias.forEach(function (item) {
                        if (item.metros < masCercano.metros) masCercano = item;
                    });

                    const km = (masCercano.metros / 1000).toFixed(1);
                    info.textContent = 'El punto más cercano es ' + masCercano.punto.nombre + ' (a ' + km + ' km).';

                    mapa.fitBounds([usuario, [masCercano.punto.lat, masCercano.punto.lng]], { padding: [60, 60] });
                    seleccionar(masCercano.punto, false);
                    marcadores.get(masCercano.punto.id).openPopup();
                },
                function () {
                    info.textContent = 'No pudimos obtener tu ubicación. Revisa los permisos del navegador.';
                }
            );
        });

        // Primer dibujo: todos los puntos
        mostrarPuntos('todo', false);

        // Si venimos del buscador del inicio (?id=3), abrir ese punto
        const idEnUrl = new URLSearchParams(window.location.search).get('id');

        if (idEnUrl !== null) {
            const puntoUrl = buscarPorId(activos, Number(idEnUrl));

            if (puntoUrl !== undefined) {
                seleccionar(puntoUrl, true);
            } else {
                info.textContent = 'No se encontró el punto solicitado.';
            }
        }
    }

});

// ---------- Funciones auxiliares de interfaz (módulo) ----------

// Crea un elemento con texto (textContent evita insertar HTML por error)
function crearElemento(etiqueta, texto) {
    const elemento = document.createElement(etiqueta);
    elemento.textContent = texto;
    return elemento;
}

// Convierte un objeto "punto" en una tarjeta del DOM
function crearTarjeta(punto, textoEnlace, href) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'punto';
    tarjeta.dataset.id = punto.id;

    const lista = document.createElement('ul');
    punto.materiales.forEach(function (material) {
        lista.appendChild(crearElemento('li', material));
    });

    const enlace = crearElemento('a', textoEnlace);
    enlace.href = href;

    tarjeta.append(
        crearElemento('h2', punto.nombre),
        crearElemento('p', 'Horario: ' + punto.horario),
        crearElemento('p', 'Dirección: ' + punto.direccion),
        crearElemento('p', 'Materiales:'),
        lista,
        enlace
    );

    return tarjeta;
}