import { obtenerToken } from './sesionService'

const API_BASE = (
  import.meta.env.VITE_SPRING_API_URL ||
  'http://localhost:8080'
).replace(/\/+$/, '')

const API_URL = `${API_BASE}/api/v1/boletas`

async function solicitar(ruta = '', opciones = {}) {
  const token = obtenerToken()

  if (!token) {
    throw new Error('Debes iniciar sesión para realizar esta operación.')
  }

  let respuesta

  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opciones.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...opciones.headers
      }
    })
  } catch {
    throw new Error(
      'No se pudo conectar con Spring Boot. Comprueba el puerto 8080.'
    )
  }

  const datos = respuesta.status === 204
    ? null
    : await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error(
        'Tu sesión expiró. Vuelve a iniciar sesión.'
      )
    }

    if (respuesta.status === 403) {
      throw new Error(
        'No tienes permisos para realizar esta operación.'
      )
    }

    throw new Error(
      datos?.error ||
      `No se pudo procesar el pedido (${respuesta.status}).`
    )
  }

  return datos
}

export function obtenerPedidos() {
  return solicitar()
}

export function obtenerMisPedidos() {
  return solicitar('/mias')
}

export async function crearPedido(datosPedido) {
  const cuerpo = {
    clienteNombre: datosPedido.cliente.nombre.trim(),
    clienteCorreo: datosPedido.cliente.correo.trim(),
    clienteTelefono: datosPedido.cliente.telefono.trim(),
    envioRegion: datosPedido.envio.region,
    envioComuna: datosPedido.envio.comuna,
    envioDireccion: datosPedido.envio.direccion.trim(),
    items: datosPedido.productos.map(producto => ({
      productoId: String(producto.id),
      cantidad: Number(producto.cantidad)
    })),
    cupon: datosPedido.cupon || null
  }

  return solicitar('', {
    method: 'POST',
    body: JSON.stringify(cuerpo)
  })
}