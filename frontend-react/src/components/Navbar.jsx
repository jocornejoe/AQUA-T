import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { contarProductosCarrito } from '../services/carritoService'
import { categoriasProducto } from '../services/productosService'
import { obtenerSesion, cerrarSesion } from '../services/sesionService'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const navRef = useRef(null)
  const categoriasBotonRef = useRef(null)

  const [cantidadCarrito, setCantidadCarrito] = useState(
    contarProductosCarrito()
  )
  const [sesion, setSesion] = useState(() => obtenerSesion())
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [categoriasAbiertas, setCategoriasAbiertas] = useState(false)

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

  useEffect(() => {
    setMenuAbierto(false)
    setCategoriasAbiertas(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    function cerrarAlPulsarFuera(evento) {
      if (navRef.current && !navRef.current.contains(evento.target)) {
        setCategoriasAbiertas(false)
        setMenuAbierto(false)
      }
    }

    function cerrarConEscape(evento) {
      if (evento.key === 'Escape') {
        setCategoriasAbiertas(false)
        setMenuAbierto(false)
        categoriasBotonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', cerrarAlPulsarFuera)
    document.addEventListener('keydown', cerrarConEscape)

    return () => {
      document.removeEventListener('pointerdown', cerrarAlPulsarFuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [])

  function cerrarMenus() {
    setMenuAbierto(false)
    setCategoriasAbiertas(false)
  }

  function salir() {
    cerrarSesion()
    setSesion(null)
    cerrarMenus()
    navigate('/', { replace: true })
  }

  const esEquipo = ['Administrador', 'Vendedor'].includes(
    sesion?.tipoUsuario
  )

  return (
    <nav
      className="navbar navbar-custom sticky-top aquat-navbar"
      ref={navRef}
      aria-label="Navegación principal"
    >
      <div className="container aquat-nav-contenedor">

        <Link
          className="navbar-brand flex-shrink-0"
          to="/"
          onClick={cerrarMenus}
        >
          <img src="/assetsimg/logo.png" alt="Logo de AQUA-T" />
          AQUA-T
        </Link>

        <button
          type="button"
          className="aquat-menu-boton"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
          aria-controls="aquat-menu-principal"
          onClick={() => {
            setMenuAbierto(abierto => !abierto)
            setCategoriasAbiertas(false)
          }}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          id="aquat-menu-principal"
          className={`aquat-menu-panel ${
            menuAbierto ? 'aquat-menu-panel-abierto' : ''
          }`}
        >
          <ul className="navbar-nav aquat-menu-lista">

            <li className="nav-item aquat-productos">
              <div className="aquat-productos-cabecera">

                <Link
                  className="nav-link"
                  to="/productos"
                  onClick={cerrarMenus}
                >
                  Productos
                </Link>

                <button
                  ref={categoriasBotonRef}
                  type="button"
                  className="aquat-productos-flecha"
                  aria-label="Mostrar categorías de productos"
                  aria-expanded={categoriasAbiertas}
                  aria-controls="aquat-lista-categorias"
                  onClick={() => {
                    setCategoriasAbiertas(abiertas => !abiertas)
                  }}
                >
                  {categoriasAbiertas ? '▴' : '▾'}
                </button>
              </div>

              {categoriasAbiertas && (
                <div
                  id="aquat-lista-categorias"
                  className="aquat-productos-submenu"
                >
                  <Link to="/productos" onClick={cerrarMenus}>
                    Ver todos los productos
                  </Link>

                  <div className="aquat-submenu-separador" />

                  {categoriasProducto.map(categoria => (
                    <Link
                      key={categoria}
                      to={`/categorias/${encodeURIComponent(categoria)}`}
                      onClick={cerrarMenus}
                    >
                      {categoria}
                    </Link>
                  ))}

                  <div className="aquat-submenu-separador" />

                  <Link to="/ofertas" onClick={cerrarMenus}>
                    Ofertas
                  </Link>
                </div>
              )}
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/nosotros" onClick={cerrarMenus}>
                Nosotros
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/blogs" onClick={cerrarMenus}>
                Blog
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/contacto" onClick={cerrarMenus}>
                Contacto
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="icono-carrito"
                to="/carrito"
                onClick={cerrarMenus}
              >
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
                    <Link
                      className="nav-link"
                      to="/admin"
                      onClick={cerrarMenus}
                    >
                      Panel
                    </Link>
                  </li>
                )}

                <li className="nav-item">
                  <Link
                    className="nav-link aquat-usuario"
                    to="/mi-cuenta"
                    onClick={cerrarMenus}
                    title={sesion.correo}
                  >
                    👤 {sesion.nombre}
                  </Link>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    className="nav-link aquat-salir"
                    onClick={salir}
                  >
                    Cerrar sesión
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/login"
                    onClick={cerrarMenus}
                  >
                    Iniciar sesión
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/registro"
                    onClick={cerrarMenus}
                  >
                    Registrarse
                  </Link>
                </li>
              </>
            )}

          </ul>
        </div>

      </div>
    </nav>
  )
}

export default Navbar