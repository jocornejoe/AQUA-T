import { Link, Navigate, useNavigate } from 'react-router-dom'

import Navbar from '../components/Navbar'

import {
  obtenerSesion,
  cerrarSesion
} from '../services/sesionService'

function MiCuenta() {
  const navigate = useNavigate()
  const sesion = obtenerSesion()

  if (!sesion) {
    return <Navigate to="/login" replace />
  }

  const esEquipo = [
    'Administrador',
    'Vendedor'
  ].includes(sesion.tipoUsuario)

  const datos = [
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

  return (
    <>
      <Navbar />

      <section className="contacto-section">
        <div className="container">

          <h1 className="contacto-titulo">
            Mi cuenta
          </h1>

          <p className="contacto-intro">
            Consulta los datos de tu sesión en AQUA-T.
          </p>

          <div className="contacto-card">

            <div className="d-flex align-items-center gap-3 mb-4">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 65,
                  height: 65,
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

                <span className="badge bg-primary">
                  {sesion.tipoUsuario}
                </span>
              </div>
            </div>

            <h3 className="h5 mb-3">
              Información de mi cuenta
            </h3>

            <div className="row g-3">
              {datos.map(([etiqueta, valor]) => (
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