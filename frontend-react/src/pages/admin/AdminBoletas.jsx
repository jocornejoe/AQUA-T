import { useEffect, useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { obtenerSesion } from '../../services/sesionService'
import { formatearCLP } from '../../services/carritoService'
import {
  obtenerBoletas,
  obtenerBoletaPorId,
  cambiarEstadoBoleta
} from '../../services/boletasService'

const ESTADOS = ['Confirmado', 'Enviado', 'Entregado', 'Cancelado']

function fechaLegible(fecha) {
  if (!fecha) return 'Sin fecha'
  const valor = new Date(fecha)
  return Number.isNaN(valor.getTime())
    ? String(fecha)
    : valor.toLocaleString('es-CL')
}

function AdminBoletas() {
  const esAdministrador = obtenerSesion()?.tipoUsuario === 'Administrador'
  const [boletas, setBoletas] = useState([])
  const [seleccionada, setSeleccionada] = useState(null)
  const [estadoNuevo, setEstadoNuevo] = useState('Confirmado')
  const [cargando, setCargando] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    let activo = true

    async function cargar() {
      try {
        const datos = await obtenerBoletas()
        if (activo) setBoletas(datos)
      } catch (e) {
        if (activo) setError(e.message)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => { activo = false }
  }, [])

  async function verDetalle(id) {
    setCargandoDetalle(true)
    setError('')
    setMensaje('')
    setSeleccionada(null)
    try {
      const boleta = await obtenerBoletaPorId(id)
      setSeleccionada(boleta)
      setEstadoNuevo(boleta.estado)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargandoDetalle(false)
    }
  }

  async function guardarEstado() {
    if (!esAdministrador || !seleccionada) return
    setGuardando(true)
    setError('')
    setMensaje('')
    try {
      const actualizada = await cambiarEstadoBoleta(seleccionada.id, estadoNuevo)
      setSeleccionada(actualizada)
      setBoletas(actuales => actuales.map(b =>
        b.id === actualizada.id ? actualizada : b
      ))
      setMensaje('Estado actualizado correctamente.')
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-contenido">
        <div className="admin-header"><h1>Órdenes y boletas</h1></div>
        <div className="admin-panel">
          {cargando && <p>Cargando órdenes...</p>}
          {error && <p className="text-danger" role="alert">{error}</p>}
          {!cargando && !error && boletas.length === 0 && (
            <p className="text-muted mb-0">Todavía no hay órdenes registradas.</p>
          )}
          {!cargando && boletas.length > 0 && (
            <div className="table-responsive">
              <table className="table admin-tabla">
                <thead><tr>
                  <th>N.º</th><th>Fecha</th><th>Cliente</th>
                  <th>Total</th><th>Estado</th><th>Acción</th>
                </tr></thead>
                <tbody>
                  {boletas.map(b => (
                    <tr key={b.id}>
                      <td>#{b.id}</td>
                      <td>{fechaLegible(b.fecha)}</td>
                      <td>{b.clienteNombre}</td>
                      <td>{formatearCLP(Number(b.total))}</td>
                      <td>{b.estado}</td>
                      <td>
                        <button type="button" className="btn btn-sm btn-outline-primary"
                          onClick={() => verDetalle(b.id)}>
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {cargandoDetalle && <div className="admin-panel mt-3">Cargando detalle...</div>}
        {seleccionada && (
          <div className="admin-panel mt-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 mb-0">Boleta #{seleccionada.id}</h2>
              <button type="button" className="btn btn-sm btn-outline-secondary"
                onClick={() => setSeleccionada(null)}>Cerrar detalle</button>
            </div>
            <p><strong>Fecha:</strong> {fechaLegible(seleccionada.fecha)}</p>
            <p><strong>Cliente:</strong> {seleccionada.clienteNombre}</p>
            <p><strong>Correo:</strong> {seleccionada.clienteCorreo}</p>
            <p><strong>Teléfono:</strong> {seleccionada.clienteTelefono || 'No indicado'}</p>
            <p><strong>Envío:</strong> {seleccionada.envioDireccion}, {seleccionada.envioComuna}, {seleccionada.envioRegion}</p>
            <p><strong>Estado:</strong> {seleccionada.estado}</p>
            <div className="table-responsive">
              <table className="table">
                <thead><tr>
                  <th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th>
                </tr></thead>
                <tbody>
                  {(seleccionada.detalles || []).map((d, i) => (
                    <tr key={d.id ?? `${d.productoId}-${i}`}>
                      <td>{d.productoNombre}</td>
                      <td>{d.cantidad}</td>
                      <td>{formatearCLP(Number(d.precioUnitario))}</td>
                      <td>{formatearCLP(Number(d.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p><strong>Subtotal:</strong> {formatearCLP(Number(seleccionada.subtotal))}</p>
            <p><strong>Total:</strong> {formatearCLP(Number(seleccionada.total))}</p>
            {esAdministrador && (
              <div className="d-flex flex-wrap align-items-end gap-2">
                <div>
                  <label className="form-label" htmlFor="estadoBoleta">Cambiar estado</label>
                  <select id="estadoBoleta" className="form-select"
                    value={estadoNuevo} onChange={e => setEstadoNuevo(e.target.value)}>
                    {ESTADOS.map(e => <option value={e} key={e}>{e}</option>)}
                  </select>
                </div>
                <button type="button" className="btn btn-primary"
                  onClick={guardarEstado}
                  disabled={guardando || estadoNuevo === seleccionada.estado}>
                  {guardando ? 'Guardando...' : 'Guardar estado'}
                </button>
              </div>
            )}
            {mensaje && <p className="text-success mt-2">{mensaje}</p>}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminBoletas