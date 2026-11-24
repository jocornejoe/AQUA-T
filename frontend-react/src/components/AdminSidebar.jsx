import { Link, NavLink, useNavigate } from 'react-router-dom'

import {
  obtenerSesion,
  cerrarSesion
} from '../services/sesionService'

function AdminSidebar() {
  const navigate = useNavigate()
  const sesion = obtenerSesion()

  const esAdministrador =
    sesion?.tipoUsuario === 'Administrador'

  const clase = ({ isActive }) =>
    `admin-nav-link ${isActive ? 'activo' : ''}`

  function salir() {
    cerrarSesion()
    navigate('/', { replace: true })
  }

  return (
    <aside className="admin-sidebar">

      <Link
        className="admin-brand"
        to={esAdministrador ? '/admin' : '/admin/productos'}
      >
        <img
          src="/assetsimg/logo.png"
          alt="Logo de AQUA-T"
        />

        AQUA-T {esAdministrador ? 'Admin' : 'Vendedor'}
      </Link>

      <div
        className="px-4 pb-3 mb-3"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <div className="fw-bold">
          {sesion?.nombre} {sesion?.apellidos}
        </div>

        <div className="small text-white-50">
          {sesion?.correo}
        </div>

        <span className="badge bg-light text-dark mt-2">
          {sesion?.tipoUsuario}
        </span>
      </div>

      <ul className="admin-nav">

        {esAdministrador && (
          <li>
            <NavLink to="/admin" end className={clase}>
              Dashboard
            </NavLink>
          </li>
        )}

        <li>
          <NavLink to="/admin/productos" className={clase}>
            Productos
          </NavLink>
        </li>

        <li>
          <NavLink to="/admin/boletas" className={clase}>
            Órdenes
          </NavLink>
        </li>

        {esAdministrador && (
          <li>
            <NavLink to="/admin/usuarios" className={clase}>
              Usuarios
            </NavLink>
          </li>
        )}

      </ul>

      <div className="admin-volver">

        <Link
          to="/mi-cuenta"
          className="d-block mb-3"
        >
          Mi perfil
        </Link>

        <Link
          to="/"
          className="d-block mb-3"
        >
          ← Volver a la tienda
        </Link>

        <button
          type="button"
          className="btn btn-outline-light btn-sm w-100"
          onClick={salir}
        >
          Cerrar sesión
        </button>

      </div>

    </aside>
  )
}

export default AdminSidebar