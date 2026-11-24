import { obtenerToken } from './sesionService'

const API_BASE = (
  import.meta.env.VITE_SPRING_API_URL || 'http://localhost:8080'
).replace(/\/+$/, '')

const API_URL = `${API_BASE}/api/v1/boletas`

async function solicitar(ruta = '', opciones = {}) {
  const token = obtenerToken()

  if (!token) {
    throw new Error('Inicia sesión para consultar las boletas.')
  }

  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
        ...opciones.headers
      }
    })
  } catch {
    throw new Error('No se pudo conectar con Spring Boot (puerto 8080).')
  }

  const datos = respuesta.status === 204
    ? null
    : await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.')
    }
    if (respuesta.status === 403) {
      throw new Error('No tienes permisos para consultar o modificar boletas.')
    }
    throw new Error(datos?.error || `Error del servidor (${respuesta.status}).`)
  }

  return datos
}

export function obtenerBoletas() {
  return solicitar()
}

export function obtenerBoletaPorId(id) {
  return solicitar(`/${encodeURIComponent(id)}`)
}

export function cambiarEstadoBoleta(id, estado) {
  return solicitar(`/${encodeURIComponent(id)}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado })
  })
}