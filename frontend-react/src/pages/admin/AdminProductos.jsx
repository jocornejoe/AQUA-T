import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { obtenerSesion } from '../../services/sesionService'
import { obtenerProductos, eliminarProducto } from '../../services/productosService'
import { formatearCLP } from '../../services/carritoService'

function AdminProductos() {
  const esAdministrador = obtenerSesion()?.tipoUsuario === 'Administrador'
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    async function cargar() {
      try {
        const datos = await obtenerProductos()
        if (activo) setProductos(datos)
      } catch (e) {
        if (activo) setError(e.message)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [])

  async function eliminar(id) {
    const producto = productos.find(p => p.id === id)
    if (!producto || !window.confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) {
      return
    }
    try {
      await eliminarProducto(id)
      setProductos(actuales => actuales.filter(p => p.id !== id))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-contenido">
        <div className="admin-header">
          <h1>Productos</h1>
          {esAdministrador && (
            <Link to="/admin/productos/nuevo" className="btn btn-enviar">
              + Nuevo producto
            </Link>
          )}
        </div>
        <div className="admin-panel">
          {cargando && <p className="text-muted text-center">Cargando productos...</p>}
          {error && <p className="text-danger text-center">{error}</p>}
          {!cargando && productos.length === 0 && (
            <p className="text-muted text-center mb-0">Todavía no hay productos registrados.</p>
          )}
          {productos.length > 0 && (
            <div className="table-responsive">
              <table className="table admin-tabla">
                <thead><tr>
                  <th>Código</th><th>Nombre</th><th>Categoría</th>
                  <th>Precio</th><th>Stock</th><th>Stock crítico</th>
                  <th className="text-end">Acciones</th>
                </tr></thead>
                <tbody>
                  {productos.map(producto => {
                    const stockBajo = producto.stockCritico != null &&
                      producto.stock <= producto.stockCritico
                    return (
                      <tr key={producto.id}>
                        <td>{producto.codigo}</td>
                        <td>{producto.nombre}</td>
                        <td>{producto.categoria}</td>
                        <td>{formatearCLP(producto.precio)}</td>
                        <td>
                          {producto.stock}
                          {stockBajo && <span className="badge bg-danger ms-2">Stock bajo</span>}
                        </td>
                        <td>{producto.stockCritico ?? '-'}</td>
                        <td className="text-end">
                          <Link className="btn btn-sm btn-outline-secondary me-2"
                            to={`/productos/${producto.id}`}>
                            Ver detalle
                          </Link>
                          {esAdministrador && (
                            <>
                              <Link className="btn btn-sm btn-outline-primary me-2"
                                to={`/admin/productos/${producto.id}/editar`}>Editar</Link>
                              <button type="button" className="btn btn-sm btn-outline-danger"
                                onClick={() => eliminar(producto.id)}>Eliminar</button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminProductos