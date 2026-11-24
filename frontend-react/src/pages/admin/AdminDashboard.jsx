import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { obtenerSesion } from '../../services/sesionService'
import { obtenerUsuarios } from '../../services/usuariosService'
import { obtenerProductos } from '../../services/productosService'

function AdminDashboard() {
  const sesion = obtenerSesion()
  const esAdministrador = sesion?.tipoUsuario === 'Administrador'
  const [totalProductos, setTotalProductos] = useState(0)
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!esAdministrador) return
    let activo = true

    async function cargar() {
      const resultados = await Promise.allSettled([
        obtenerProductos(),
        obtenerUsuarios()
      ])
      if (!activo) return
      if (resultados[0].status === 'fulfilled') {
        setTotalProductos(resultados[0].value.length)
      }
      if (resultados[1].status === 'fulfilled') {
        setTotalUsuarios(resultados[1].value.length)
      }
      if (resultados.some(r => r.status === 'rejected')) {
        setError('No se pudieron cargar todos los indicadores.')
      }
    }
    cargar()
    return () => { activo = false }
  }, [esAdministrador])

  if (!esAdministrador) return <Navigate to="/admin/productos" replace />

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-contenido">
        <div className="admin-header"><h1>¡Hola {sesion?.nombre}!</h1></div>
        {error && <p className="text-danger">{error}</p>}
        <div className="row g-4 mb-4">
          <div className="col-12 col-sm-6 col-md-4">
            <div className="admin-card-stat">
              <div className="admin-stat-numero">{totalProductos}</div>
              <div className="admin-stat-label">Productos registrados</div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-4">
            <div className="admin-card-stat">
              <div className="admin-stat-numero">{totalUsuarios}</div>
              <div className="admin-stat-label">Usuarios registrados</div>
            </div>
          </div>
        </div>
        <div className="admin-panel">
          <p className="mb-0">
            Desde este panel puedes gestionar productos, usuarios y consultar las órdenes de AQUA-T.
          </p>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard