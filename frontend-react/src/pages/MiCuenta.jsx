import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import Navbar from '../components/Navbar'

import {
  obtenerSesion,
  cerrarSesion
} from '../services/sesionService'

import { obtenerMisPedidos } from '../services/pedidosService'
import { formatearCLP } from '../services/carritoService'

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha'

  const valor = new Date(fecha)

  if (Number.isNaN(valor.getTime())) {
    return String(fecha)
  }

  return valor.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function MiCuenta() {
  const navigate = useNavigate()
  const sesion = obtenerSesion()

  const esCliente = sesion?.tipoUsuario === 'Cliente'

  const esEquipo = [
    'Administrador',
    'Vendedor'
  ].includes(sesion?.tipoUsuario)

  const [pestana, setPestana] = useState('perfil')
  const [compras, setCompras] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [detalleAbierto, setDetalleAbierto] = useState(null)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    if (!esCliente || pestana !== 'compras') {
      return
    }

    let activo = true

    async function cargarCompras() {
      setCargando(true)
      setError('')

      try {
        const datos = await obtenerMisPedidos()

        if (!Array.isArray(datos)) {
          throw new Error(
            'Spring Boot no devolvió una lista de compras válida.'
          )
        }

        if (activo) {
          setCompras(datos)
        }
      } catch (e) {
        if (activo) {
          setError(
            e.message || 'No se pudieron cargar tus compras.'
          )
        }
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    cargarCompras()

    return () => {
      activo = false
    }
  }, [esCliente, pestana, recarga])

  if (!sesion) {
    return <Navigate to="/login" replace />
  }

  const datosPerfil = [
    ['Nombre', sesion.nombre],
    ['Apellidos', sesion.apellidos],
    ['Correo electrónico', sesion.correo],
    ['Tipo de usuario', sesion.tipoUsuario],
    ['Teléfono', sesion.telefono],
    ['Región', sesion.region],
    ['Comuna', sesion.comuna],
    ['Dirección', sesion.direccion]
  ]

  function salir() {
    cerrarSesion()
    navigate('/', { replace: true })
  }

  function mostrarCompras() {
    setPestana('compras')
    setDetalleAbierto(null)
  }

  return (
    <>
      <Navbar />

      <section className="contacto-section">
        <div className="container">

          <h1 className="contacto-titulo">
            Mi cuenta
          </h1>

          <p className="contacto-intro">
            Consulta tus datos personales y revisa la
            información de tu cuenta en AQUA-T.
          </p>

          <div className="contacto-card">

            {/* IDENTIDAD DEL USUARIO */}

            <div className="d-flex align-items-center gap-3 mb-4">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 65,
                  height: 65,
                  flexShrink: 0,
                  backgroundColor: 'var(--fondo-claro)',
                  color: 'var(--azul-profundo)',
                  fontSize: 30
                }}
              >
                👤
              </div>

              <div>
                <h2 className="h4 mb-1">
                  {sesion.nombre} {sesion.apellidos}
                </h2>

                <div className="small text-muted mb-2">
                  {sesion.correo}
                </div>

                <span className="badge bg-primary">
                  {sesion.tipoUsuario}
                </span>
              </div>
            </div>

            {/* NAVEGACIÓN DENTRO DEL PERFIL */}

            <div className="d-flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                className={`btn ${
                  pestana === 'perfil'
                    ? 'btn-primary'
                    : 'btn-outline-primary'
                }`}
                onClick={() => setPestana('perfil')}
              >
                Mi perfil
              </button>

              {esCliente && (
                <button
                  type="button"
                  className={`btn ${
                    pestana === 'compras'
                      ? 'btn-primary'
                      : 'btn-outline-primary'
                  }`}
                  onClick={mostrarCompras}
                >
                  Mis compras
                </button>
              )}
            </div>

            {/* DATOS DEL PERFIL */}

            {pestana === 'perfil' && (
              <>
                <h3 className="h5 mb-3">
                  Información de mi cuenta
                </h3>

                <div className="row g-3">
                  {datosPerfil.map(([etiqueta, valor]) => (
                    <div
                      className="col-12 col-md-6"
                      key={etiqueta}
                    >
                      <div className="p-3 border rounded h-100">
                        <div className="small text-muted mb-1">
                          {etiqueta}
                        </div>

                        <div className="fw-semibold">
                          {valor || 'No registrado'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* HISTORIAL DE COMPRAS DEL CLIENTE */}

            {esCliente && pestana === 'compras' && (
              <>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                  <div>
                    <h3 className="h5 mb-1">
                      Mi historial de compras
                    </h3>

                    <p className="text-muted small mb-0">
                      Boletas registradas con tu cuenta.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setRecarga(valor => valor + 1)}
                    disabled={cargando}
                  >
                    Actualizar
                  </button>
                </div>

                {cargando && (
                  <p className="text-muted" role="status">
                    Cargando tus compras...
                  </p>
                )}

                {error && !cargando && (
                  <div className="alert alert-danger" role="alert">
                    <p className="mb-2">
                      {error}
                    </p>

                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => setRecarga(valor => valor + 1)}
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {!cargando && !error && compras.length === 0 && (
                  <div className="text-center py-4 border rounded">
                    <h4 className="h5">
                      Aún no tienes compras registradas
                    </h4>

                    <p className="text-muted">
                      Cuando compres en AQUA-T,
                      tus boletas aparecerán aquí.
                    </p>

                    <Link
                      to="/productos"
                      className="btn btn-primary"
                    >
                      Explorar productos
                    </Link>
                  </div>
                )}

                {!cargando && !error && compras.map(boleta => {
                  const subtotal = Number(boleta.subtotal ?? 0)
                  const total = Number(boleta.total ?? 0)
                  const descuento = Math.max(0, subtotal - total)

                  const abierto = detalleAbierto === boleta.id

                  const direccion = [
                    boleta.envioDireccion,
                    boleta.envioComuna,
                    boleta.envioRegion
                  ].filter(Boolean).join(', ')

                  return (
                    <div
                      className="border rounded p-3 mb-3 bg-white"
                      key={boleta.id}
                    >
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">

                        <div>
                          <h4
                            className="h5 mb-2"
                            style={{
                              color: 'var(--azul-profundo)'
                            }}
                          >
                            Boleta #{boleta.id}
                          </h4>

                          <p className="text-muted small mb-2">
                            {formatearFecha(boleta.fecha)}
                          </p>

                          <span className="badge bg-secondary">
                            {boleta.estado}
                          </span>
                        </div>

                        <div className="text-end">
                          <p className="mb-2">
                            <strong>
                              {formatearCLP(total)}
                            </strong>
                          </p>

                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            aria-expanded={abierto}
                            aria-controls={`detalle-boleta-${boleta.id}`}
                            onClick={() => {
                              setDetalleAbierto(
                                abierto ? null : boleta.id
                              )
                            }}
                          >
                            {abierto
                              ? 'Ocultar detalle'
                              : 'Ver detalle'}
                          </button>
                        </div>
                      </div>

                      {abierto && (
                        <div
                          id={`detalle-boleta-${boleta.id}`}
                          className="mt-4 pt-3 border-top"
                        >
                          <h5 className="h6 mb-3">
                            Productos de la compra
                          </h5>

                          {Array.isArray(boleta.detalles) &&
                          boleta.detalles.length > 0 ? (
                            <div className="table-responsive">
                              <table className="table table-sm align-middle">
                                <thead>
                                  <tr>
                                    <th>Producto</th>
                                    <th className="text-center">
                                      Cantidad
                                    </th>
                                    <th className="text-end">
                                      Precio
                                    </th>
                                    <th className="text-end">
                                      Subtotal
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {boleta.detalles.map((detalle, indice) => (
                                    <tr
                                      key={detalle.id ?? `${detalle.productoId}-${indice}`}
                                    >
                                      <td>
                                        {detalle.productoNombre}
                                      </td>

                                      <td className="text-center">
                                        {detalle.cantidad}
                                      </td>

                                      <td className="text-end">
                                        {formatearCLP(
                                          Number(detalle.precioUnitario)
                                        )}
                                      </td>

                                      <td className="text-end">
                                        {formatearCLP(
                                          Number(detalle.subtotal)
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-muted">
                              No hay detalles disponibles para esta boleta.
                            </p>
                          )}

                          <div className="row g-3 mt-2">
                            <div className="col-12 col-md-6">
                              <h5 className="h6">
                                Información de envío
                              </h5>

                              <p className="small mb-1">
                                <strong>Destinatario:</strong>{' '}
                                {boleta.clienteNombre}
                              </p>

                              <p className="small mb-1">
                                <strong>Dirección:</strong>{' '}
                                {direccion || 'No registrada'}
                              </p>

                              <p className="small mb-0">
                                <strong>Teléfono:</strong>{' '}
                                {boleta.clienteTelefono || 'No indicado'}
                              </p>
                            </div>

                            <div className="col-12 col-md-6">
                              <h5 className="h6">
                                Resumen de la compra
                              </h5>

                              <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal</span>
                                <span>
                                  {formatearCLP(subtotal)}
                                </span>
                              </div>

                              {descuento > 0 && (
                                <div className="d-flex justify-content-between text-success mb-2">
                                  <span>Descuento</span>
                                  <span>
                                    -{formatearCLP(descuento)}
                                  </span>
                                </div>
                              )}

                              <div className="d-flex justify-content-between border-top pt-2">
                                <strong>Total</strong>
                                <strong>
                                  {formatearCLP(total)}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}

            {/* ACCIONES GENERALES */}

            <div className="d-flex flex-wrap gap-3 mt-4">

              {esEquipo && (
                <Link
                  to="/admin"
                  className="btn btn-primary"
                >
                  Ir al panel
                </Link>
              )}

              <Link
                to="/productos"
                className="btn btn-outline-primary"
              >
                Ver productos
              </Link>

              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={salir}
              >
                Cerrar sesión
              </button>

            </div>

          </div>
        </div>
      </section>
    </>
  )
}

export default MiCuenta