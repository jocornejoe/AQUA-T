import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import Navbar from '../components/Navbar'

import {
  obtenerCarrito,
  calcularSubtotal,
  formatearCLP,
  vaciarCarrito
} from '../services/carritoService'

import { obtenerSesion } from '../services/sesionService'
import { crearPedido } from '../services/pedidosService'
import { regionesComunas } from '../data/regiones'

function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()

  const sesion = obtenerSesion()
  const carrito = obtenerCarrito()

  const cupon = String(
    location.state?.cupon || ''
  ).trim().toUpperCase()

  const porcentajeDescuento =
    cupon === 'AQUA10'
      ? 0.10
      : cupon === 'VERANO20'
        ? 0.20
        : 0

  const [formulario, setFormulario] = useState(() => {
    const indiceRegion = regionesComunas.findIndex(
      item => item.region === sesion?.region
    )

    const comunaGuardada = sesion?.comuna || ''

    const comunaValida =
      indiceRegion >= 0 &&
      regionesComunas[indiceRegion].comunas.includes(
        comunaGuardada
      )

    return {
      nombre: [
        sesion?.nombre,
        sesion?.apellidos
      ].filter(Boolean).join(' '),

      correo: sesion?.correo || '',
      telefono: sesion?.telefono || '',

      region:
        indiceRegion >= 0
          ? String(indiceRegion)
          : '',

      comuna: comunaValida ? comunaGuardada : '',
      direccion: sesion?.direccion || ''
    }
  })

  const [procesando, setProcesando] = useState(false)
  const [mensajeError, setMensajeError] = useState('')

  const subtotal = calcularSubtotal(carrito)
  const descuento = subtotal * porcentajeDescuento
  const totalEstimado = Math.max(subtotal - descuento, 0)

  const regionSeleccionada =
    formulario.region === ''
      ? null
      : regionesComunas[Number(formulario.region)]

  const comunasDisponibles =
    regionSeleccionada?.comunas || []

  function actualizarCampo(evento) {
    const { name, value } = evento.target

    setFormulario(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'region' ? { comuna: '' } : {})
    }))

    setMensajeError('')
  }

  async function confirmarCompra(evento) {
    evento.preventDefault()

    if (procesando) return

    if (!sesion) {
      setMensajeError('Debes iniciar sesión para comprar.')
      return
    }

    if (
      !formulario.nombre.trim() ||
      !formulario.correo.trim() ||
      !regionSeleccionada ||
      !formulario.comuna ||
      !formulario.direccion.trim()
    ) {
      setMensajeError(
        'Completa los datos de envío obligatorios.'
      )
      return
    }

    if (!comunasDisponibles.includes(formulario.comuna)) {
      setMensajeError(
        'Selecciona una comuna válida para la región.'
      )
      return
    }

    setProcesando(true)
    setMensajeError('')

    try {
      const pedido = await crearPedido({
        cliente: {
          nombre: formulario.nombre,
          correo: formulario.correo,
          telefono: formulario.telefono
        },

        envio: {
          region: regionSeleccionada.region,
          comuna: formulario.comuna,
          direccion: formulario.direccion
        },

        productos: carrito,
        cupon
      })

      if (!pedido?.id) {
        throw new Error(
          'Spring Boot no confirmó el número de la boleta.'
        )
      }

      // Solo vaciamos el carrito después de la respuesta exitosa.
      vaciarCarrito()

      navigate('/compra-exitosa', {
        replace: true,
        state: {
          pedidoId: pedido.id,
          subtotal: Number(pedido.subtotal),
          total: Number(pedido.total)
        }
      })
    } catch (error) {
      setMensajeError(
        error.message || 'No se pudo completar la compra.'
      )
    } finally {
      setProcesando(false)
    }
  }

  if (carrito.length === 0) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center">
          <h2>No hay productos para comprar</h2>
          <p className="text-muted">
            Agrega productos antes de continuar con el pago.
          </p>
          <Link to="/productos" className="btn btn-primary">
            Ver productos
          </Link>
        </div>
      </>
    )
  }

  if (!sesion) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center">
          <div className="contacto-card">
            <h2>Inicia sesión para comprar</h2>
            <p>
              Para registrar tu boleta en AQUA-T debes
              iniciar sesión con una cuenta.
            </p>
            <p className="text-muted">
              Los productos permanecerán en tu carrito.
            </p>
            <Link to="/login" className="btn btn-enviar">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />

      <section className="contacto-section">
        <div className="container">
          <h2 className="contacto-titulo">
            Finalizar compra
          </h2>

          <p className="contacto-intro">
            Revisa tus datos y completa la información
            de envío.
          </p>

          <div className="row g-4">
            <div className="col-12 col-lg-7">
              <div className="contacto-card">
                <h4
                  className="mb-4"
                  style={{ color: 'var(--azul-profundo)' }}
                >
                  Datos del cliente
                </h4>

                <form onSubmit={confirmarCompra}>
                  <div className="mb-3">
                    <label className="form-label">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      className="form-control"
                      maxLength={150}
                      required
                      value={formulario.nombre}
                      onChange={actualizarCampo}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Correo
                    </label>
                    <input
                      type="email"
                      name="correo"
                      className="form-control"
                      maxLength={100}
                      required
                      value={formulario.correo}
                      onChange={actualizarCampo}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Teléfono (opcional)
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      className="form-control"
                      maxLength={20}
                      value={formulario.telefono}
                      onChange={actualizarCampo}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Región
                      </label>
                      <select
                        name="region"
                        className="form-select"
                        required
                        value={formulario.region}
                        onChange={actualizarCampo}
                      >
                        <option value="">
                          -- Seleccione --
                        </option>
                        {regionesComunas.map((item, index) => (
                          <option
                            key={item.region}
                            value={index}
                          >
                            {item.region}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Comuna
                      </label>
                      <select
                        name="comuna"
                        className="form-select"
                        required
                        disabled={!regionSeleccionada}
                        value={formulario.comuna}
                        onChange={actualizarCampo}
                      >
                        <option value="">
                          -- Seleccione --
                        </option>
                        {comunasDisponibles.map(comuna => (
                          <option key={comuna} value={comuna}>
                            {comuna}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Dirección de envío
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      className="form-control"
                      maxLength={300}
                      required
                      value={formulario.direccion}
                      onChange={actualizarCampo}
                    />
                  </div>

                  {mensajeError && (
                    <div
                      className="text-danger mb-3"
                      role="alert"
                    >
                      {mensajeError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-enviar w-100"
                    disabled={procesando}
                  >
                    {procesando
                      ? 'Procesando...'
                      : 'Confirmar compra'}
                  </button>
                </form>
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="resumen-carrito">
                <h4 className="mb-4">Resumen</h4>

                {carrito.map(item => (
                  <div
                    className="d-flex justify-content-between mb-2"
                    key={item.id}
                  >
                    <span>
                      {item.nombre} x{item.cantidad}
                    </span>
                    <span>
                      {formatearCLP(
                        item.precio * item.cantidad
                      )}
                    </span>
                  </div>
                ))}

                <hr />

                <div className="d-flex justify-content-between">
                  <span>Subtotal estimado</span>
                  <span>{formatearCLP(subtotal)}</span>
                </div>

                {descuento > 0 && (
                  <div
                    className="d-flex justify-content-between text-success"
                  >
                    <span>Descuento {cupon}</span>
                    <span>-{formatearCLP(descuento)}</span>
                  </div>
                )}

                <hr />

                <div
                  className="d-flex justify-content-between fs-5"
                >
                  <strong>Total estimado</strong>
                  <strong>{formatearCLP(totalEstimado)}</strong>
                </div>

                <p className="small text-muted mt-3 mb-0">
                  Spring Boot verificará los precios y el stock
                  en MySQL. El total definitivo quedará
                  registrado en la boleta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <p className="mb-0">
          © 2026 AQUA-T Derechos Reservados
        </p>
      </footer>
    </>
  )
}

export default Checkout