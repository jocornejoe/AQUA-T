
import { useState } from 'react'
import { Link } from 'react-router-dom'

import Navbar from '../components/Navbar'
import { regionesComunas } from '../data/regiones'
import { registrarCliente } from '../services/registroService'

import {
  formatearRunEntrada,
  validarRun,
  validarNombreRegistro,
  validarApellidos,
  validarCorreoRegistro,
  validarContrasena,
  validarConfirmarContrasena,
  validarTelefonoRegistro,
  validarFechaNacimiento,
  validarRegion,
  validarComuna,
  validarDireccion
} from '../utils/validacionesRegistro'

const estadoInicial = {
  run: '',
  nombre: '',
  apellidos: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
  telefono: '',
  fechaNacimiento: '',
  region: '',
  comuna: '',
  direccion: ''
}

function Registro() {
  const [formulario, setFormulario] =
    useState(estadoInicial)

  const [errores, setErrores] =
    useState({})

  const [mensajeForm, setMensajeForm] =
    useState('')

  const [registroExitoso, setRegistroExitoso] =
    useState(false)

  const [procesando, setProcesando] =
    useState(false)

  const regionSeleccionada =
    formulario.region === ''
      ? null
      : regionesComunas[Number(formulario.region)]

  const comunasDisponibles =
    regionSeleccionada?.comunas || []

  function validarCampo(campo, datos) {
    switch (campo) {
      case 'run':
        return validarRun(datos.run)

      case 'nombre':
        return validarNombreRegistro(datos.nombre)

      case 'apellidos':
        return validarApellidos(datos.apellidos)

      case 'correo':
        return validarCorreoRegistro(datos.correo)

      case 'contrasena':
        return validarContrasena(datos.contrasena)

      case 'confirmarContrasena':
        return validarConfirmarContrasena(
          datos.contrasena,
          datos.confirmarContrasena
        )

      case 'telefono':
        return validarTelefonoRegistro(datos.telefono)

      case 'fechaNacimiento':
        return validarFechaNacimiento(datos.fechaNacimiento)

      case 'region':
        return validarRegion(datos.region)

      case 'comuna':
        return validarComuna(datos.comuna)

      case 'direccion':
        return validarDireccion(datos.direccion)

      default:
        return ''
    }
  }

  function actualizarCampo(evento) {
    const { name, value } = evento.target

    const valor =
      name === 'run'
        ? formatearRunEntrada(value)
        : value

    setFormulario(prev => ({
      ...prev,
      [name]: valor,
      ...(name === 'region' ? { comuna: '' } : {})
    }))

    setErrores(prev => ({
      ...prev,
      [name]: '',
      ...(name === 'region' ? { comuna: '' } : {}),
      ...(name === 'contrasena'
        ? { confirmarContrasena: '' }
        : {})
    }))

    setMensajeForm('')
    setRegistroExitoso(false)
  }

  function validarAlSalir(evento) {
    const { name, value } = evento.target

    const datosActualizados = {
      ...formulario,
      [name]: value
    }

    setErrores(prev => ({
      ...prev,
      [name]: validarCampo(name, datosActualizados)
    }))
  }

  async function registrar(evento) {
    evento.preventDefault()

    if (procesando) return

    const nuevosErrores = {}

    Object.keys(estadoInicial).forEach(campo => {
      nuevosErrores[campo] =
        validarCampo(campo, formulario)
    })

    setErrores(nuevosErrores)

    const hayErrores = Object.values(nuevosErrores)
      .some(error => error !== '')

    if (hayErrores) {
      setMensajeForm(
        'Corrige los campos marcados antes de continuar.'
      )
      setRegistroExitoso(false)
      return
    }

    if (!regionSeleccionada) {
      setMensajeForm('Selecciona una región válida.')
      return
    }

    setProcesando(true)
    setMensajeForm('')
    setRegistroExitoso(false)

    try {
      const usuarioCreado = await registrarCliente({
        ...formulario,
        region: regionSeleccionada.region
      })

      setMensajeForm(
        `¡Registro exitoso! Bienvenido/a ${
          usuarioCreado.nombre || formulario.nombre.trim()
        }. Ya puedes iniciar sesión.`
      )

      setRegistroExitoso(true)
      setFormulario(estadoInicial)
      setErrores({})

    } catch (error) {
      const mensaje =
        error.message || 'No se pudo completar el registro'

      setMensajeForm(mensaje)
      setRegistroExitoso(false)

      if (error.campos) {
        setErrores(prev => ({
          ...prev,
          ...error.campos
        }))
      }

      if (/RUN.*registrad/i.test(mensaje)) {
        setErrores(prev => ({
          ...prev,
          run: mensaje
        }))
      }

      if (/correo.*registrad/i.test(mensaje)) {
        setErrores(prev => ({
          ...prev,
          correo: mensaje
        }))
      }

    } finally {
      setProcesando(false)
    }
  }

  return (
    <>
      <Navbar />

      <section className="contacto-section">
        <div className="container">

          <div className="text-end mb-3">
            <Link to="/login">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>

          <h2 className="contacto-titulo">
            Registro de usuario
          </h2>

          <p className="contacto-intro">
            Crea tu cuenta para comprar más rápido
            y hacer seguimiento a tus pedidos.
          </p>

          <div className="text-center mb-4">
  <Link
    to="/registro/google"
    className="btn btn-outline-primary"
  >
    Registrarme con Google
  </Link>
</div>

          <div className="contacto-card">

            <form onSubmit={registrar} noValidate>

              {/* RUN Y NOMBRE */}
              <div className="row">

                <div className="col-md-6 mb-3">
                  <label
                    htmlFor="run"
                    className="form-label"
                  >
                    RUN / RUT
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    id="run"
                    name="run"
                    placeholder="Ej: 12345678-5"
                    maxLength={10}
                    value={formulario.run}
                    onChange={actualizarCampo}
                    onBlur={validarAlSalir}
                    autoComplete="off"
                  />

                  <div className="form-text">
                    Sin puntos y con guion.
                    Ejemplo: 12345678-5
                  </div>

                  <div className="campo-error">
                    {errores.run}
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label
                    htmlFor="nombre"
                    className="form-label"
                  >
                    Nombre
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    id="nombre"
                    name="nombre"
                    maxLength={50}
                    value={formulario.nombre}
                    onChange={actualizarCampo}
                    onBlur={validarAlSalir}
                  />

                  <div className="form-text">
                    Máx. 50 caracteres
                  </div>

                  <div className="campo-error">
                    {errores.nombre}
                  </div>
                </div>

              </div>

              {/* APELLIDOS Y CORREO */}
              <div className="row">

                <div className="col-md-6 mb-3">
                  <label
                    htmlFor="apellidos"
                    className="form-label"
                  >
                    Apellidos
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    id="apellidos"
                    name="apellidos"
                    maxLength={100}
                    value={formulario.apellidos}
                    onChange={actualizarCampo}
                    onBlur={validarAlSalir}
                  />

                  <div className="campo-error">
                    {errores.apellidos}
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label
                    htmlFor="correo"
                    className="form-label"
                  >
                    Correo
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    id="correo"
                    name="correo"
                    maxLength={100}
                    value={formulario.correo}
                    onChange={actualizarCampo}
                    onBlur={validarAlSalir}
                  />

                  <div className="form-text">
                    Solo @duoc.cl, @profesor.duoc.cl
                    o @gmail.com
                  </div>

                  <div className="campo-error">
                    {errores.correo}
                  </div>
                </div>

              </div>

              {/* CONTRASEÑAS */}
              <div className="row">

                <div className="col-md-6 mb-3">
                  <label
                    htmlFor="contrasena"
                    className="form-label"
                  >
                    Contraseña
                  </label>

                  <input
                    type="password"
                    className="form-control"
                    id="contrasena"
                    name="contrasena"
                    maxLength={20}
                    value={formulario.contrasena}
                    onChange={actualizarCampo}
                    onBlur={validarAlSalir}
                    autoComplete="new-password"
                  />

                  <div className="form-text">
                    Entre 6 y 20 caracteres
                  </div>

                  <div className="campo-error">
                    {errores.contrasena}
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label
                    htmlFor="confirmarContrasena"
                    className="form-label"
                  >
                    Confirmar contraseña
                  </label>

                  <input
                    type="password"
                    className="form-control"
                    id="confirmarContrasena"
                    name="confirmarContrasena"
                    maxLength={20}
                    value={formulario.confirmarContrasena}
                    onChange={actualizarCampo}
                    onBlur={validarAlSalir}
                    autoComplete="new-password"
                  />

                  <div className="campo-error">
                    {errores.confirmarContrasena}
                  </div>
                </div>

              </div>

              {/* TELÉFONO Y FECHA DE NACIMIENTO */}
              <div className="row">

                <div className="col-md-6 mb-3">
                  <label
                    htmlFor="telefono"
                    className="form-label"
                  >
                    Teléfono (opcional)
                  </label>

                  <input
                    type="tel"
                    className="form-control"
                    id="telefono"
                    name="telefono"
                    placeholder="Ej: 912345678"
                    maxLength={15}
                    value={formulario.telefono}
                    onChange={actualizarCampo}
                    onBlur={validarAlSalir}
                  />

                  <div className="campo-error">
                    {errores.telefono}
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label
                    htmlFor="fechaNacimiento"
                    className="form-label"
                  >
                    Fecha de nacimiento (opcional)
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    id="fechaNacimiento"
                    name="fechaNacimiento"
                    value={formulario.fechaNacimiento}
                    onChange={actualizarCampo}
                    onBlur={validarAlSalir}
                  />

                  <div className="campo-error">
                    {errores.fechaNacimiento}
                  </div>
                </div>

              </div>

              {/* REGIÓN Y COMUNA */}
              <div className="row">

                <div className="col-md-6 mb-3">
                  <label
                    htmlFor="region"
                    className="form-label"
                  >
                    Región
                  </label>

                  <select
                    className="form-select"
                    id="region"
                    name="region"
                    value={formulario.region}
                    onChange={actualizarCampo}
                    onBlur={validarAlSalir}
                  >
                    <option value="">
                      -- Seleccione la región --
                    </option>

                    {regionesComunas.map((item, index) => (
                      <option
                        value={index}
                        key={item.region}
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
                  <label
                    htmlFor="comuna"
                    className="form-label"
                  >
                    Comuna
                  </label>

                  <select
                    className="form-select"
                    id="comuna"
                    name="comuna"
                    value={formulario.comuna}
                    onChange={actualizarCampo}
                    onBlur={validarAlSalir}
                    disabled={!regionSeleccionada}
                  >
                    <option value="">
                      -- Seleccione la comuna --
                    </option>

                    {comunasDisponibles.map(comuna => (
                      <option
                        value={comuna}
                        key={comuna}
                      >
                        {comuna}
                      </option>
                    ))}
                  </select>

                  <div className="campo-error">
                    {errores.comuna}
                  </div>
                </div>

              </div>

              {/* DIRECCIÓN */}
              <div className="mb-3">
                <label
                  htmlFor="direccion"
                  className="form-label"
                >
                  Dirección
                </label>

                <input
                  type="text"
                  className="form-control"
                  id="direccion"
                  name="direccion"
                  maxLength={300}
                  value={formulario.direccion}
                  onChange={actualizarCampo}
                  onBlur={validarAlSalir}
                />

                <div className="form-text">
                  Máx. 300 caracteres
                </div>

                <div className="campo-error">
                  {errores.direccion}
                </div>
              </div>

              {/* MENSAJE DE REGISTRO */}
              {mensajeForm && (
                <div
                  className={`mb-3 ${
                    registroExitoso
                      ? 'text-primary fw-semibold'
                      : 'text-danger'
                  }`}
                >
                  {mensajeForm}

                  {registroExitoso && (
                    <p className="mt-2">
                      <Link to="/login">
                        Ir a iniciar sesión
                      </Link>
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-enviar"
                disabled={procesando}
              >
                {procesando
                  ? 'Registrando...'
                  : 'Registrar'}
              </button>

            </form>

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

export default Registro
