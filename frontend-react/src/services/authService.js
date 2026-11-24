const API_BASE = (
  import.meta.env.VITE_SPRING_API_URL ||
  'http://localhost:8080'
).replace(/\/+$/, '')

const API_AUTH = `${API_BASE}/api/v1/auth`

async function solicitarLogin(ruta, cuerpo) {
  let respuesta

  try {
    respuesta = await fetch(`${API_AUTH}/${ruta}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cuerpo)
    })
  } catch {
    throw new Error(
      'No se pudo conectar con Spring Boot. Comprueba el puerto 8080.'
    )
  }

  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    throw new Error(
      datos?.error ||
      `No se pudo iniciar sesión (${respuesta.status})`
    )
  }

  if (!datos?.token || !datos?.usuario) {
    throw new Error(
      'Spring Boot no devolvió una sesión válida'
    )
  }

  return datos
}

export function iniciarSesion(correo, contrasena) {
  return solicitarLogin('login', {
    correo: correo.trim().toLowerCase(),
    contrasena
  })
}

export function iniciarSesionGoogle(credential) {
  if (!credential) {
    throw new Error('Google no devolvió una credencial')
  }

  return solicitarLogin('google', { credential })
}