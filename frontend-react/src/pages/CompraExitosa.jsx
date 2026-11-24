import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { formatearCLP } from '../services/carritoService'

function CompraExitosa() {
  const location = useLocation()

  const pedidoId = location.state?.pedidoId
  const subtotal = location.state?.subtotal
  const total = location.state?.total

  const descuento =
    typeof subtotal === 'number' &&
    typeof total === 'number'
      ? subtotal - total
      : 0

  return (
    <>
      <Navbar />

      <div className="container py-5 text-center">
        <div className="contacto-card">
          <h1
            className="fw-bold"
            style={{ color: 'var(--azul-profundo)' }}
          >
            ¡Compra registrada con éxito!
          </h1>

          <p className="mt-3">
            Gracias por comprar en AQUA-T.
          </p>

          {pedidoId && (
            <p>
              Número de boleta:{' '}
              <strong>#{pedidoId}</strong>
            </p>
          )}

          {typeof total === 'number' && (
            <>
              {descuento > 0 && (
                <>
                  <p>
                    Subtotal: {formatearCLP(subtotal)}
                  </p>
                  <p className="text-success">
                    Descuento: -{formatearCLP(descuento)}
                  </p>
                </>
              )}

              <p className="fs-5">
                <strong>
                  Total de la boleta: {formatearCLP(total)}
                </strong>
              </p>
            </>
          )}

          <Link
            to="/productos"
            className="btn btn-primary mt-3"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </>
  )
}

export default CompraExitosa