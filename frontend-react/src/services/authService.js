
const API_AUTH =
  `${import.meta.env.VITE_SPRING_API_URL || 'http://localhost:8080'}/api/v1/auth`

export async function iniciarSesion(correo, contrasena) {
  let respuesta

  try {
    respuesta = await fetch(
      `${API_AUTH}/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correo: correo.trim().toLowerCase(),
          contrasena
        })
      }
    )
  } catch {
    throw new Error(
      'No se pudo conectar con Spring Boot. Verifica que esté iniciado en el puerto 8080.'
    )
  }

  const datos = await respuesta.json()
    .catch(() => null)

  if (!respuesta.ok) {
    throw new Error(
      datos?.error ||
      `Error al iniciar sesión (${respuesta.status})`
    )
  }

  if (!datos?.token || !datos?.usuario) {
    throw new Error(
      'Spring Boot no devolvió el token JWT o los datos del usuario.'
    )
  }

  return {
    token: datos.token,
    usuario: datos.usuario
  }
}

