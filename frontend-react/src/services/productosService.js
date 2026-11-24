import { obtenerToken } from './sesionService'

const API_BASE = (
  import.meta.env.VITE_SPRING_API_URL ||
  'http://localhost:8080'
).replace(/\/+$/, '')

const API_URL = `${API_BASE}/api/v1/productos`

export const categoriasProducto = [
  'Filtros',
  'Bombas',
  'Accesorios',
  'Piscinas',
  'Químicos'
]

function normalizarProducto(producto) {
  return {
    ...producto,
    precio: Number(producto.precio),

    precioAnterior:
      producto.precioAnterior == null
        ? null
        : Number(producto.precioAnterior),

    stock: Number(producto.stock),

    stockCritico:
      producto.stockCritico == null
        ? null
        : Number(producto.stockCritico)
  }
}

function prepararProducto(datos, anterior = {}) {
  const precioAnterior =
    datos.precioAnterior === undefined
      ? anterior.precioAnterior ?? null
      : datos.precioAnterior === '' ||
          datos.precioAnterior === null
        ? null
        : Number(datos.precioAnterior)

  const descuento =
    datos.descuento === undefined
      ? anterior.descuento ?? null
      : datos.descuento || null

  return {
    nombre: String(
      datos.nombre ?? anterior.nombre ?? ''
    ).trim(),

    descripcion: String(
      datos.descripcion ?? anterior.descripcion ?? ''
    ).trim(),

    precio: Number(
      datos.precio ?? anterior.precio
    ),

    precioAnterior,
    descuento,

    stock: Number(
      datos.stock ?? anterior.stock
    ),

    stockCritico:
      datos.stockCritico == null ||
      datos.stockCritico === ''
        ? null
        : Number(datos.stockCritico),

    categoria: String(
      datos.categoria ?? anterior.categoria ?? ''
    ).trim(),

    imagen: String(
      datos.imagen ??
      anterior.imagen ??
      '/assetsimg/logo.png'
    ).trim()
  }
}

async function solicitar(
  url,
  opciones = {},
  protegida = false
) {
  const headers = {
    ...(opciones.body !== undefined
      ? { 'Content-Type': 'application/json' }
      : {})
  }

  if (protegida) {
    const token = obtenerToken()

    if (!token) {
      throw new Error(
        'Debes iniciar sesión como administrador.'
      )
    }

    headers.Authorization = `Bearer ${token}`
  }

  let respuesta

  try {
    respuesta = await fetch(url, {
      ...opciones,
      headers: {
        ...headers,
        ...opciones.headers
      }
    })
  } catch {
    throw new Error(
      'No se pudo conectar con Spring Boot en el puerto 8080.'
    )
  }

  if (respuesta.status === 204) {
    return null
  }

  const datos = await respuesta.json()
    .catch(() => null)

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error(
        'Tu sesión expiró o el token no es válido. Inicia sesión nuevamente.'
      )
    }

    if (respuesta.status === 403) {
      throw new Error(
        'No tienes permisos para modificar productos.'
      )
    }

    throw new Error(
      datos?.error ||
      `Error al procesar la solicitud (${respuesta.status}).`
    )
  }

  return datos
}

export async function obtenerProductos() {
  const productos = await solicitar(API_URL)

  return productos.map(normalizarProducto)
}

export async function obtenerProductoPorId(id) {
  const producto = await solicitar(
    `${API_URL}/${encodeURIComponent(id)}`
  )

  return normalizarProducto(producto)
}

export async function agregarProducto(datosProducto) {
  const resultado = await solicitar(
    API_URL,
    {
      method: 'POST',
      body: JSON.stringify(
        prepararProducto(datosProducto)
      )
    },
    true
  )

  return normalizarProducto(resultado)
}

export async function actualizarProducto(
  id,
  datosActualizados
) {
  // Conservamos los datos de oferta que el
  // formulario actual todavía no permite editar.
  const productoAnterior =
    await obtenerProductoPorId(id)

  const resultado = await solicitar(
    `${API_URL}/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(
        prepararProducto(
          datosActualizados,
          productoAnterior
        )
      )
    },
    true
  )

  return normalizarProducto(resultado)
}

export async function eliminarProducto(id) {
  await solicitar(
    `${API_URL}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE'
    },
    true
  )

  return true
}