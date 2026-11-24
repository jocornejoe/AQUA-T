import { jwtDecode } from 'jwt-decode'

const SESION_KEY = 'aquaT_sesion'

function tokenVigente(token) {
  if (!token || typeof token !== 'string') {
    return false
  }

  try {
    const datos = jwtDecode(token)

    return (
      typeof datos.exp === 'number' &&
      datos.exp * 1000 > Date.now()
    )
  } catch {
    return false
  }
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

  if (!datos) return null

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