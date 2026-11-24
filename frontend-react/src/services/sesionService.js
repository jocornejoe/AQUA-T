import { jwtDecode } from 'jwt-decode'

const SESION_KEY = 'aquaT_sesion'

const API_BASE = (
  import.meta.env.VITE_SPRING_API_URL ||
  'http://localhost:8080'
).replace(/\/+$/, '')

const VENTANA_RENOVACION_MS = 5 * 60 * 1000

let renovacionEnCurso = null

function obtenerExpiracion(token) {
  if (!token || typeof token !== 'string') {
    return 0
  }

  try {
    const datos = jwtDecode(token)

    return typeof datos.exp === 'number'
      ? datos.exp * 1000
      : 0
  } catch {
    return 0
  }
}

function tokenVigente(token) {
  return obtenerExpiracion(token) > Date.now()
}

export function guardarSesion(usuario, token) {
  if (!tokenVigente(token)) {
    throw new Error(
      'No se recibió un token de sesión válido'
    )
  }

  const sesion = {
    id: usuario.id,
    correo: usuario.correo,
    nombre: usuario.nombre,
    apellidos: usuario.apellidos,
    tipoUsuario: usuario.tipoUsuario,

    telefono: usuario.telefono || '',
    region: usuario.region || '',
    comuna: usuario.comuna || '',
    direccion: usuario.direccion || '',

    token
  }

  sessionStorage.setItem(
    SESION_KEY,
    JSON.stringify(sesion)
  )

  window.dispatchEvent(
    new Event('sesionActualizada')
  )

  return sesion
}

export function obtenerSesion() {
  const datos = sessionStorage.getItem(SESION_KEY)

  if (!datos) {
    return null
  }

  try {
    const sesion = JSON.parse(datos)

    if (!tokenVigente(sesion?.token)) {
      sessionStorage.removeItem(SESION_KEY)
      return null
    }

    return sesion
  } catch {
    sessionStorage.removeItem(SESION_KEY)
    return null
  }
}

export function obtenerToken() {
  return obtenerSesion()?.token || null
}

export function cerrarSesion() {
  sessionStorage.removeItem(SESION_KEY)

  window.dispatchEvent(
    new Event('sesionActualizada')
  )
}

export async function renovarSesionSiNecesario() {
  const sesion = obtenerSesion()

  if (!sesion) {
    return null
  }

  const tiempoRestante =
    obtenerExpiracion(sesion.token) - Date.now()

  if (tiempoRestante > VENTANA_RENOVACION_MS) {
    return sesion
  }

  // Evita peticiones de renovación simultáneas.
  if (renovacionEnCurso) {
    return renovacionEnCurso
  }

  const tokenOriginal = sesion.token

  const peticion = (async () => {
    let respuesta

    try {
      respuesta = await fetch(
        `${API_BASE}/api/v1/auth/renovar`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenOriginal}`
          }
        }
      )
    } catch {
      // Si hay un problema de red, conservamos el
      // token mientras siga vigente.
      return obtenerSesion()
    }

    const datos = await respuesta.json()
      .catch(() => null)

    if (!respuesta.ok) {
      const sesionActual = obtenerSesion()

      if (
        [401, 403].includes(respuesta.status) &&
        sesionActual?.token === tokenOriginal
      ) {
        cerrarSesion()
      }

      throw new Error(
        datos?.error ||
        'No se pudo renovar la sesión'
      )
    }

    if (!datos?.token || !datos?.usuario) {
      throw new Error(
        'Spring Boot no devolvió un token renovado válido'
      )
    }

    /*
     * Si el usuario cerró sesión o inició otra,
     * una respuesta anterior no debe restaurarla.
     */
    const sesionActual = obtenerSesion()

    if (
      !sesionActual ||
      sesionActual.token !== tokenOriginal
    ) {
      return sesionActual
    }

    return guardarSesion(
      datos.usuario,
      datos.token
    )
  })()

  renovacionEnCurso = peticion

  try {
    return await peticion
  } finally {
    if (renovacionEnCurso === peticion) {
      renovacionEnCurso = null
    }
  }
}