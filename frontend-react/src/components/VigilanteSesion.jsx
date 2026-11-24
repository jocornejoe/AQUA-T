import { useEffect } from 'react'

import {
  obtenerSesion,
  cerrarSesion,
  renovarSesionSiNecesario
} from '../services/sesionService'

function VigilanteSesion() {
  useEffect(() => {
    function revisarSesion() {

      // No renovamos sesiones mientras
      // la pestaña está oculta.
      if (document.visibilityState !== 'visible') {
        return
      }

      const habiaSesion =
        sessionStorage.getItem('aquaT_sesion') !== null

      const sesion = obtenerSesion()

      if (!sesion) {
        if (habiaSesion) {
          cerrarSesion()
        }

        return
      }

      renovarSesionSiNecesario().catch(() => {
        // Un error de conexión no debe bloquear
        // la navegación del usuario.
        // Si el token expira, se cerrará la sesión.
      })
    }

    revisarSesion()

    const intervalo = window.setInterval(
      revisarSesion,
      60_000
    )

    document.addEventListener(
      'visibilitychange',
      revisarSesion
    )

    window.addEventListener(
      'focus',
      revisarSesion
    )

    window.addEventListener(
      'sesionActualizada',
      revisarSesion
    )

    return () => {
      window.clearInterval(intervalo)

      document.removeEventListener(
        'visibilitychange',
        revisarSesion
      )

      window.removeEventListener(
        'focus',
        revisarSesion
      )

      window.removeEventListener(
        'sesionActualizada',
        revisarSesion
      )
    }
  }, [])

  return null
}

export default VigilanteSesion