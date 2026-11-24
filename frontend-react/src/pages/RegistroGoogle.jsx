import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

import Navbar from '../components/Navbar'
import BotonGoogle from '../components/BotonGoogle'

import { regionesComunas } from '../data/regiones'
import { registrarClienteGoogle } from '../services/registroService'
import { guardarSesion } from '../services/sesionService'

import {
  formatearRunEntrada,
  validarRun,
  validarNombreRegistro,
  validarApellidos,
  validarTelefonoRegistro,
  validarFechaNacimiento,
  validarRegion,
  validarComuna,
  validarDireccion
} from '../utils/validacionesRegistro'

const inicial = {
  run: '',
  nombre: '',
  apellidos: '',
  telefono: '',
  fechaNacimiento: '',
  region: '',
  comuna: '',
  direccion: ''
}

function RegistroGoogle() {
  const navigate = useNavigate()

  const [credential, setCredential] = useState('')
  const [correoGoogle, setCorreoGoogle] = useState('')
  const [formulario, setFormulario] = useState(inicial)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [procesando, setProcesando] = useState(false)

  const regionSeleccionada = formulario.region === ''
    ? null
    : regionesComunas[Number(formulario.region)]

  const comunas = regionSeleccionada?.comunas || []

  function seleccionarGoogle(tokenGoogle) {
    try {
      // Solamente mostramos datos de la credencial.
      // La verificación real ocurre en Spring Boot.
      const datos = jwtDecode(tokenGoogle)

      if (!datos.email) {
        throw new Error('Google no entregó el correo.')
      }

      setCredential(tokenGoogle)
      setCorreoGoogle(datos.email)

      setFormulario(prev => ({
        ...prev,
        nombre: datos.given_name || prev.nombre,
        apellidos: datos.family_name || prev.apellidos
      }))

      setMensaje('')
      setErrores({})
    } catch {
      setMensaje(
        'No se pudo leer la información de la cuenta Google.'
      )
    }
  }

  function actualizarCampo(evento) {
    const { name, value } = evento.target

    setFormulario(prev => ({
      ...prev,
      [name]: name === 'run'
        ? formatearRunEntrada(value)
        : value,
      ...(name === 'region' ? { comuna: '' } : {})
    }))

    setErrores(prev => ({
      ...prev,
      [name]: ''
    }))

    setMensaje('')
  }

  async function registrar(evento) {
    evento.preventDefault()

    if (procesando) return

    if (!credential) {
      setMensaje('Primero selecciona tu cuenta de Google.')
      return
    }

    const nuevosErrores = {
      run: validarRun(formulario.run),
      nombre: validarNombreRegistro(formulario.nombre),
      apellidos: validarApellidos(formulario.apellidos),
      telefono: validarTelefonoRegistro(formulario.telefono),
      fechaNacimiento: validarFechaNacimiento(
        formulario.fechaNacimiento
      ),
      region: validarRegion(formulario.region),
      comuna: validarComuna(formulario.comuna),
      direccion: validarDireccion(formulario.direccion)
    }

    if (
      regionSeleccionada &&
      formulario.comuna &&
      !comunas.includes(formulario.comuna)
    ) {
      nuevosErrores.comuna =
        'La comuna no pertenece a la región.'
    }

    setErrores(nuevosErrores)

    const primerError = Object.values(nuevosErrores)
      .find(error => error !== '')

    if (primerError) {
      setMensaje(primerError)
      return
    }

    setProcesando(true)
    setMensaje('')

    try {
      const resultado = await registrarClienteGoogle(
        {
          ...formulario,
          region: regionSeleccionada.region
        },
        credential
      )

      guardarSesion(resultado.usuario, resultado.token)

      navigate('/', { replace: true })
    } catch (error) {
      setMensaje(
        error.message || 'No se pudo crear la cuenta.'
      )
    } finally {
      setProcesando(false)
    }
  }

  return (
    <>
      <Navbar />

      <section className="contacto-section">
        <div className="container">

          <h2 className="contacto-titulo">
            Registro con Google
          </h2>

          <p className="contacto-intro">
            Selecciona una cuenta de Google y completa
            los datos necesarios para registrarte en AQUA-T.
          </p>


          <div className="contacto-card">

            <div className="text-center mb-4">
              {!credential ? (
                <>
                  <p className="mb-3">
                    Primero, selecciona tu cuenta:
                  </p>

                  <div className="d-flex justify-content-center">
                    <BotonGoogle
                      onExito={seleccionarGoogle}
                      onError={setMensaje}
                    />
                  </div>
                </>
              ) : (
                <div className="alert alert-info">
                  <strong>Cuenta Google seleccionada</strong>

                  <p className="mb-2 mt-2">
                    {correoGoogle}
                  </p>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setCredential('')
                      setCorreoGoogle('')
                      setMensaje('')
                    }}
                  >
                    Cambiar cuenta de Google
                  </button>
                </div>
              )}
            </div>

            {mensaje && (
              <div className="alert alert-danger" role="alert">
                {mensaje}
              </div>
            )}

            {credential && (
              <form onSubmit={registrar} noValidate>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="googleRun">
                      RUN / RUT
                    </label>

                    <input
                      id="googleRun"
                      type="text"
                      name="run"
                      className="form-control"
                      placeholder="12345678-5"
                      maxLength={10}
                      value={formulario.run}
                      onChange={actualizarCampo}
                    />

                    <div className="form-text">
                      Sin puntos y con guion.
                    </div>
                    <div className="campo-error">
                      {errores.run}
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="googleNombre">
                      Nombre
                    </label>

                    <input
                      id="googleNombre"
                      type="text"
                      name="nombre"
                      className="form-control"
                      maxLength={50}
                      value={formulario.nombre}
                      onChange={actualizarCampo}
                    />

                    <div className="campo-error">
                      {errores.nombre}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="googleApellidos">
                      Apellidos
                    </label>

                    <input
                      id="googleApellidos"
                      type="text"
                      name="apellidos"
                      className="form-control"
                      maxLength={100}
                      value={formulario.apellidos}
                      onChange={actualizarCampo}
                    />

                    <div className="campo-error">
                      {errores.apellidos}
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="googleCorreo">
                      Correo de Google
                    </label>

                    <input
                      id="googleCorreo"
                      type="email"
                      className="form-control"
                      value={correoGoogle}
                      readOnly
                    />

                    <div className="form-text">
                      Verificado por Google al guardar.
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="googleTelefono">
                      Teléfono (opcional)
                    </label>

                    <input
                      id="googleTelefono"
                      type="tel"
                      name="telefono"
                      className="form-control"
                      maxLength={20}
                      value={formulario.telefono}
                      onChange={actualizarCampo}
                    />

                    <div className="campo-error">
                      {errores.telefono}
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="googleFecha">
                      Fecha de nacimiento (opcional)
                    </label>

                    <input
                      id="googleFecha"
                      type="date"
                      name="fechaNacimiento"
                      className="form-control"
                      value={formulario.fechaNacimiento}
                      onChange={actualizarCampo}
                    />

                    <div className="campo-error">
                      {errores.fechaNacimiento}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="googleRegion">
                      Región
                    </label>

                    <select
                      id="googleRegion"
                      name="region"
                      className="form-select"
                      value={formulario.region}
                      onChange={actualizarCampo}
                    >
                      <option value="">
                        -- Seleccione la región --
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

                    <div className="campo-error">
                      {errores.region}
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="googleComuna">
                      Comuna
                    </label>

                    <select
                      id="googleComuna"
                      name="comuna"
                      className="form-select"
                      disabled={!regionSeleccionada}
                      value={formulario.comuna}
                      onChange={actualizarCampo}
                    >
                      <option value="">
                        -- Seleccione la comuna --
                      </option>

                      {comunas.map(comuna => (
                        <option key={comuna} value={comuna}>
                          {comuna}
                        </option>
                      ))}
                    </select>

                    <div className="campo-error">
                      {errores.comuna}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="googleDireccion">
                    Dirección
                  </label>

                  <input
                    id="googleDireccion"
                    type="text"
                    name="direccion"
                    className="form-control"
                    maxLength={300}
                    value={formulario.direccion}
                    onChange={actualizarCampo}
                  />

                  <div className="campo-error">
                    {errores.direccion}
                  </div>
                </div>

                <p className="small text-muted">
                  La cuenta se creará con rol Cliente.
                  No necesitas establecer una contraseña.
                </p>

                <button
                  type="submit"
                  className="btn btn-enviar w-100"
                  disabled={procesando}
                >
                  {procesando
                    ? 'Registrando...'
                    : 'Crear cuenta con Google'}
                </button>
              </form>
            )}

            <div className="text-center mt-4">
              <p>
                <Link to="/registro">
                  Registrarme con correo y contraseña
                </Link>
              </p>

              <p className="mb-0">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login">
                  Iniciar sesión
                </Link>
              </p>
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

export default RegistroGoogle