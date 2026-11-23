import { obtenerSesion } from './sesionService'
import { iniciarSesion } from './authService'

const API_BASE =
  import.meta.env.VITE_SPRING_API_URL ||
  'http://localhost:8080'

const API_URL = `${API_BASE}/api/v1/usuarios`

export const tiposUsuario = [
  'Administrador',
  'Cliente',
  'Vendedor'
]

function normalizarRun(run) {
  return String(run ?? '')
    .replace(/[.\-\s]/g, '')
    .toUpperCase()
}

function normalizarUsuario(usuario) {
  return {
    ...usuario,

    id: Number(usuario.id),

    fechaNacimiento: usuario.fechaNacimiento
      ? String(usuario.fechaNacimiento).slice(0, 10)
      : ''
  }
}

function prepararDatosUsuario(datos) {
  const {
    confirmarContrasena,
    ...resto
  } = datos

  return {
    ...resto,

    run: normalizarRun(datos.run),

    correo: String(datos.correo ?? '')
      .trim()
      .toLowerCase(),

    fechaNacimiento: datos.fechaNacimiento || null,

    contrasena:
      datos.contrasena?.trim()
        ? datos.contrasena
        : null
  }
}

function obtenerCabeceras(conCuerpo = false) {
  const sesion = obtenerSesion()
  const token = sesion?.token

  if (!token) {
    throw new Error(
      'No hay una sesión JWT válida. Cierra sesión y vuelve a iniciar.'
    )
  }

  return {
    Authorization: `Bearer ${token}`,

    ...(conCuerpo
      ? { 'Content-Type': 'application/json' }
      : {})
  }
}

async function solicitar(url, opciones = {}) {
  const cabeceras = obtenerCabeceras(
    opciones.body !== undefined
  )

  let respuesta

  try {
    respuesta = await fetch(url, {
      ...opciones,

      headers: {
        ...cabeceras,
        ...opciones.headers
      }
    })
  } catch {
    throw new Error(
      'No se pudo conectar con Spring Boot. ' +
      'Comprueba que esté iniciado en el puerto 8080.'
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
        'La sesión ha expirado o el token no es válido. ' +
        'Vuelve a iniciar sesión.'
      )
    }

    if (respuesta.status === 403) {
      throw new Error(
        'No tienes permisos para realizar esta operación.'
      )
    }

    throw new Error(
      datos?.error ||
      `Error del servidor (${respuesta.status})`
    )
  }

  return datos
}

export async function obtenerUsuarios() {
  const usuarios = await solicitar(API_URL)

  return usuarios.map(normalizarUsuario)
}

export async function obtenerUsuarioPorId(id) {
  const usuario = await solicitar(
    `${API_URL}/${encodeURIComponent(id)}`
  )

  return normalizarUsuario(usuario)
}

export async function obtenerUsuarioPorCorreo(correo) {
  const usuarios = await obtenerUsuarios()

  return usuarios.find(
    usuario =>
      usuario.correo.toLowerCase() ===
      correo.trim().toLowerCase()
  ) || null
}

export async function correoExiste(
  correo,
  excluirId = null
) {
  const usuarios = await obtenerUsuarios()

  const correoBuscado =
    correo.trim().toLowerCase()

  return usuarios.some(usuario =>
    usuario.correo.toLowerCase() === correoBuscado &&
    (
      excluirId === null ||
      usuario.id !== Number(excluirId)
    )
  )
}

export async function runExiste(
  run,
  excluirId = null
) {
  const usuarios = await obtenerUsuarios()

  const runBuscado = normalizarRun(run)

  return usuarios.some(usuario =>
    normalizarRun(usuario.run) === runBuscado &&
    (
      excluirId === null ||
      usuario.id !== Number(excluirId)
    )
  )
}

// Compatibilidad con código que todavía importe
// esta función. El resultado incluye token y usuario.
export async function validarCredenciales(
  correo,
  contrasena
) {
  return iniciarSesion(correo, contrasena)
}

export async function agregarUsuario(datosUsuario) {
  const resultado = await solicitar(
    API_URL,
    {
      method: 'POST',

      body: JSON.stringify(
        prepararDatosUsuario(datosUsuario)
      )
    }
  )

  return normalizarUsuario(resultado)
}

export async function actualizarUsuario(
  id,
  datosActualizados
) {
  const resultado = await solicitar(
    `${API_URL}/${encodeURIComponent(id)}`,
    {
      method: 'PUT',

      body: JSON.stringify(
        prepararDatosUsuario(datosActualizados)
      )
    }
  )

  return normalizarUsuario(resultado)
}

export async function eliminarUsuario(id) {
  await solicitar(
    `${API_URL}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE'
    }
  )

  return true
}