import { Navigate } from 'react-router-dom'
import { obtenerSesion } from '../services/sesionService'

function RutaSoloInvitados({ children }) {
  const sesion = obtenerSesion()

  if (!sesion) {
    return children
  }

  const esEquipo = [
    'Administrador',
    'Vendedor'
  ].includes(sesion.tipoUsuario)

  return (
    <Navigate
      to={esEquipo ? '/admin' : '/mi-cuenta'}
      replace
    />
  )
}

export default RutaSoloInvitados