export const puntos = [
  {
    id: 1,
    nombre: 'Centro Comunitario Norte',
    direccion: 'Av. Siempreviva 742',
    horario: 'Lunes a Viernes: 08:00 - 18:00',
    materiales: ['Papel', 'Cartón', 'Vidrio'],
    categorias: ['Papel', 'Vidrio'],
    lat: 4.5560,
    lng: -75.6700,
    activo: true
  },
  {
    id: 2,
    nombre: 'Punto Limpio Plaza Central',
    direccion: 'Plaza de Armas',
    horario: 'Todos los días: 24hrs',
    materiales: ['Plástico PET', 'Latas'],
    categorias: ['Plástico', 'Metal'],
    lat: 4.5348,
    lng: -75.6757,
    activo: true
  },
  {
    id: 3,
    nombre: 'Ecoparque Sur',
    direccion: 'Calle del Parque 123',
    horario: 'Sábados y Domingos: 09:00 - 14:00',
    materiales: ['Electrónicos', 'Pilas'],
    categorias: ['Electrónicos'],
    lat: 4.5100,
    lng: -75.6900,
    activo: true
  },
  {
    id: 4,
    nombre: 'Estación Verde Universidad',
    direccion: 'Campus Universitario, Edificio B',
    horario: 'Lunes a Viernes: 08:00 - 20:00',
    materiales: ['Papel', 'Cartón', 'Plástico'],
    categorias: ['Papel', 'Plástico'],
    lat: 4.5528,
    lng: -75.6606,
    activo: true
  }
]

// PASO 2. Filtrar: devuelve TODOS los puntos activos que acepten la categoría.
// 'Todo' es el botón que quita el filtro. filter siempre devuelve un arreglo (o [] si nada coincide).
export function filtrarPorCategoria(coleccion, categoria) {
  return coleccion.filter(function (punto) {
    // Un punto inactivo nunca se muestra.
    if (!punto.activo) return false
    // 'Todo' deja pasar todos; en otro caso, la categoría debe estar en la lista del punto.
    return categoria === 'Todo' || punto.categorias.includes(categoria)
  })
}

// PASO 3. Buscar uno: devuelve el punto con ese id, o undefined si no existe.
// Quien llame a esta función debe comprobar el resultado antes de usar sus propiedades.
export function buscarPorId(coleccion, id) {
  return coleccion.find(function (punto) {
    return punto.id === id
  })
}
