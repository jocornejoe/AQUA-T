
import {
  normalizarRun
} from '../utils/validacionesRegistro'

const API_BASE =
  import.meta.env.VITE_SPRING_API_URL ||
  'http://localhost:8080'

export async function registrarCliente(datos) {
  const cuerpo = {
    run: normalizarRun(datos.run),
    nombre: datos.nombre.trim(),
    apellidos: datos.apellidos.trim(),
    correo: datos.correo.trim().toLowerCase(),
    contrasena: datos.contrasena,
    telefono: datos.telefono.trim(),
    fechaNacimiento: datos.fechaNacimiento || null,
    region: datos.region,
    comuna: datos.comuna,
    direccion: datos.direccion.trim()
  }

  let respuesta

  try {
    respuesta = await fetch(
      `${API_BASE}/api/v1/auth/registro`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cuerpo)
      }
    )
  } catch {
    throw new Error(
      'No se pudo conectar con Spring Boot. Comprueba el puerto 8080.'
    )
  }

  const resultado = await respuesta.json()
    .catch(() => null)

  if (!respuesta.ok) {
    const error = new Error(
      resultado?.error ||
      `No se pudo registrar (${respuesta.status})`
    )

    error.campos = resultado?.errores || {}

    throw error
  }

  if (!resultado?.id) {
    throw new Error(
      'El servidor no confirmó la creación del usuario'
    )
  }

  return resultado
}
