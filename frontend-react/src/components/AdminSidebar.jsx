import { Link, NavLink } from 'react-router-dom'
import { obtenerSesion } from '../services/sesionService'

function AdminSidebar() {
  const esAdministrador = obtenerSesion()?.tipoUsuario === 'Administrador'

  const clase = ({ isActive }) =>
    `admin-nav-link ${isActive ? 'activo' : ''}`

  return (
    <aside className="admin-sidebar">
      <Link className="admin-brand" to={esAdministrador ? '/admin' : '/admin/productos'}>
        <img src="/assetsimg/logo.png" alt="Logo de AQUA-T" />
        AQUA-T {esAdministrador ? 'Admin' : 'Vendedor'}
      </Link>
      <ul className="admin-nav">
        {esAdministrador && (
          <li><NavLink to="/admin" end className={clase}>Dashboard</NavLink></li>
        )}
        <li><NavLink to="/admin/productos" className={clase}>Productos</NavLink></li>
        <li><NavLink to="/admin/boletas" className={clase}>Órdenes</NavLink></li>
        {esAdministrador && (
          <li><NavLink to="/admin/usuarios" className={clase}>Usuarios</NavLink></li>
        )}
      </ul>
      <div className="admin-volver">
        <Link to="/">← Volver a la tienda</Link>
      </div>
    </aside>
  )
}

export default AdminSidebar