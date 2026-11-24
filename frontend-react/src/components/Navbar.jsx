import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  contarProductosCarrito
} from '../services/carritoService'

import {
  obtenerSesion,
  cerrarSesion
} from '../services/sesionService'

function Navbar() {
  const navigate = useNavigate()

  const [cantidadCarrito, setCantidadCarrito] = useState(
    contarProductosCarrito()
  )

  const [sesion, setSesion] = useState(() => obtenerSesion())

  useEffect(() => {
    function actualizarCarrito() {
      setCantidadCarrito(contarProductosCarrito())
    }

    function actualizarSesion() {
      setSesion(obtenerSesion())
    }

    window.addEventListener('carritoActualizado', actualizarCarrito)
    window.addEventListener('sesionActualizada', actualizarSesion)
    window.addEventListener('storage', actualizarCarrito)
    window.addEventListener('storage', actualizarSesion)

    return () => {
      window.removeEventListener('carritoActualizado', actualizarCarrito)
      window.removeEventListener('sesionActualizada', actualizarSesion)
      window.removeEventListener('storage', actualizarCarrito)
      window.removeEventListener('storage', actualizarSesion)
    }
  }, [])

  function salir() {
    cerrarSesion()
    setSesion(null)
    navigate('/', { replace: true })
  }

  const esEquipo = ['Administrador', 'Vendedor'].includes(
    sesion?.tipoUsuario
  )

  return (
    <nav className="navbar navbar-expand navbar-custom sticky-top">
      <div className="container d-flex flex-nowrap align-items-center">

        <Link className="navbar-brand flex-shrink-0" to="/">
          <img
            src="/assetsimg/logo.png"
            alt="Logo de AQUA-T"
          />
          AQUA-T
        </Link>

        <ul className="navbar-nav flex-row ms-auto align-items-center">

          <li className="nav-item">
            <Link className="nav-link" to="/productos">
              Productos
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/nosotros">
              Nosotros
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/blogs">
              Blog
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/contacto">
              Contacto
            </Link>
          </li>

          <li className="nav-item">
            <Link className="icono-carrito" to="/carrito">
              🛒 Carrito

              {cantidadCarrito > 0 && (
                <span className="badge-carrito">
                  {cantidadCarrito}
                </span>
              )}
            </Link>
          </li>

          {sesion ? (
            <>
              {esEquipo && (
                <li className="nav-item">
                  <Link className="nav-link" to="/admin">
                    Panel
                  </Link>
                </li>
              )}

              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/mi-cuenta"
                  title={`Sesión: ${sesion.correo}`}
                >
                  👤 {sesion.nombre}
                </Link>
              </li>

              <li className="nav-item">
                <button
                  type="button"
                  className="nav-link"
                  onClick={salir}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar sesión
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  Iniciar sesión
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/registro">
                  Registrarse
                </Link>
              </li>
            </>
          )}

        </ul>
      </div>
    </nav>
  )
}

export default Navbar