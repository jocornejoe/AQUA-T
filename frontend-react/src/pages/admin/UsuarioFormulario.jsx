import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import AdminSidebar from '../../components/AdminSidebar'
import { regionesComunas } from '../../data/regiones'
import {
  obtenerUsuarioPorId,
  agregarUsuario,
  actualizarUsuario,
  correoExiste,
  runExiste,
  tiposUsuario
} from '../../services/usuariosService'
import {
  formatearRunEntrada,
  normalizarRun,
  validarRun,
  validarNombreRegistro,
  validarApellidos,
  validarCorreoRegistro,
  validarContrasena,
  validarTelefonoRegistro,
  validarFechaNacimiento,
  validarRegion,
  validarComuna,
  validarDireccion
} from '../../utils/validacionesRegistro'

const estadoInicial = {
  run: '',
  nombre: '',
  apellidos: '',
  correo: '',
  contrasena: '',
  telefono: '',
  fechaNacimiento: '',
  tipoUsuario: '',
  region: '',
  comuna: '',
  direccion: ''
}

function mostrarRunConGuion(valor) {
  const limpio = normalizarRun(valor)

  if (/^\d{6,8}[\dK]$/.test(limpio)) {
    return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`
  }

  return String(valor ?? '')
}

function UsuarioFormulario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const modoEdicion = Boolean(id)

  const [formulario, setFormulario] = useState(estadoInicial)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [cargandoUsuario, setCargandoUsuario] = useState(modoEdicion)
  const [errorCarga, setErrorCarga] = useState('')

  useEffect(() => {
    let activo = true

    async function cargarUsuario() {
      if (!modoEdicion) {
        setCargandoUsuario(false)
        return
      }

      try {
        const usuario = await obtenerUsuarioPorId(id)
        if (!activo) return

        const indiceRegion = regionesComunas.findIndex(
          item => item.region === usuario.region
        )

        setFormulario({
          run: mostrarRunConGuion(usuario.run),
          nombre: usuario.nombre || '',
          apellidos: usuario.apellidos || '',
          correo: usuario.correo || '',
          contrasena: '',
          telefono: usuario.telefono || '',
          fechaNacimiento: usuario.fechaNacimiento || '',
          tipoUsuario: usuario.tipoUsuario || '',
          region: indiceRegion >= 0 ? String(indiceRegion) : '',
          comuna: usuario.comuna || '',
          direccion: usuario.direccion || ''
        })
      } catch (error) {
        if (activo) {
          setErrorCarga(error.message || 'No fue posible cargar el usuario.')
        }
      } finally {
        if (activo) setCargandoUsuario(false)
      }
    }

    cargarUsuario()
    return () => { activo = false }
  }, [id, modoEdicion])

  const regionSeleccionada = formulario.region === ''
    ? null
    : regionesComunas[Number(formulario.region)]

  const comunasDisponibles = regionSeleccionada?.comunas || []

  function actualizarCampo(evento) {
    const { name, value } = evento.target
    const nuevoValor = name === 'run' ? formatearRunEntrada(value) : value

    setFormulario(prev => ({
      ...prev,
      [name]: nuevoValor,
      ...(name === 'region' ? { comuna: '' } : {})
    }))

    setErrores(prev => ({
      ...prev,
      [name]: '',
      ...(name === 'region' ? { comuna: '' } : {})
    }))
    setMensaje('')
  }

  async function guardar(evento) {
    evento.preventDefault()
    if (guardando) return

    const nuevosErrores = {
      run: validarRun(formulario.run),
      nombre: validarNombreRegistro(formulario.nombre),
      apellidos: validarApellidos(formulario.apellidos),
      correo: validarCorreoRegistro(formulario.correo),
      contrasena: modoEdicion && !formulario.contrasena
        ? ''
        : validarContrasena(formulario.contrasena),
      telefono: validarTelefonoRegistro(formulario.telefono),
      fechaNacimiento: validarFechaNacimiento(formulario.fechaNacimiento),
      tipoUsuario: tiposUsuario.includes(formulario.tipoUsuario)
        ? ''
        : 'Seleccione un tipo de usuario válido',
      region: validarRegion(formulario.region),
      comuna: validarComuna(formulario.comuna),
      direccion: validarDireccion(formulario.direccion)
    }

    if (regionSeleccionada && formulario.comuna &&
        !comunasDisponibles.includes(formulario.comuna)) {
      nuevosErrores.comuna = 'La comuna no pertenece a la región seleccionada'
    }

    setErrores(nuevosErrores)

    if (Object.values(nuevosErrores).some(error => error !== '')) {
      setMensaje('Corrige los campos indicados antes de guardar.')
      return
    }

    setGuardando(true)
    setMensaje('')

    try {
      if (await runExiste(formulario.run, modoEdicion ? id : null)) {
        setErrores(prev => ({ ...prev, run: 'Este RUN ya está registrado' }))
        setMensaje('El RUN ya se encuentra registrado.')
        setGuardando(false)
        return
      }

      if (await correoExiste(formulario.correo, modoEdicion ? id : null)) {
        setErrores(prev => ({ ...prev, correo: 'Este correo ya está registrado' }))
        setMensaje('El correo ya se encuentra registrado.')
        setGuardando(false)
        return
      }

      const datos = {
        run: formulario.run,
        nombre: formulario.nombre.trim(),
        apellidos: formulario.apellidos.trim(),
        correo: formulario.correo.trim().toLowerCase(),
        contrasena: formulario.contrasena || null,
        telefono: formulario.telefono.trim(),
        fechaNacimiento: formulario.fechaNacimiento || null,
        tipoUsuario: formulario.tipoUsuario,
        region: regionSeleccionada.region,
        comuna: formulario.comuna,
        direccion: formulario.direccion.trim()
      }

      if (modoEdicion) {
        await actualizarUsuario(id, datos)
        setMensaje('¡Usuario actualizado con éxito!')
      } else {
        await agregarUsuario(datos)
        setMensaje('¡Usuario creado con éxito!')
      }

      setTimeout(() => navigate('/admin/usuarios'), 900)
    } catch (error) {
      setMensaje(error.message || 'No fue posible guardar el usuario.')
      setGuardando(false)
    }
  }

  if (cargandoUsuario || errorCarga) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-contenido">
          <div className="admin-panel">
            <p className={errorCarga ? 'text-danger' : 'text-muted'}>
              {errorCarga || 'Cargando usuario...'}
            </p>
            {errorCarga && <Link to="/admin/usuarios">Volver al listado</Link>}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-contenido">
        <div className="admin-header">
          <h1>{modoEdicion ? 'Editar usuario' : 'Nuevo usuario'}</h1>
          <Link to="/admin/usuarios" className="btn btn-outline-primary">
            ← Volver al listado
          </Link>
        </div>

        <div className="admin-panel">
          <form onSubmit={guardar} noValidate>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="run" className="form-label">RUN</label>
                <input id="run" type="text" name="run" maxLength={10}
                  placeholder="12345678-5" className="form-control"
                  value={formulario.run} onChange={actualizarCampo} />
                <div className="form-text">Sin puntos y con guion.</div>
                <div className="campo-error">{errores.run}</div>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="nombre" className="form-label">Nombre</label>
                <input id="nombre" type="text" name="nombre" maxLength={50}
                  className="form-control" value={formulario.nombre}
                  onChange={actualizarCampo} />
                <div className="campo-error">{errores.nombre}</div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="apellidos" className="form-label">Apellidos</label>
                <input id="apellidos" type="text" name="apellidos" maxLength={100}
                  className="form-control" value={formulario.apellidos}
                  onChange={actualizarCampo} />
                <div className="campo-error">{errores.apellidos}</div>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="correo" className="form-label">Correo</label>
                <input id="correo" type="email" name="correo" maxLength={100}
                  className="form-control" value={formulario.correo}
                  onChange={actualizarCampo} />
                <div className="campo-error">{errores.correo}</div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="contrasena" className="form-label">Contraseña</label>
                <input id="contrasena" type="password" name="contrasena"
                  maxLength={20} className="form-control"
                  autoComplete="new-password" value={formulario.contrasena}
                  onChange={actualizarCampo} />
                <div className="form-text">
                  {modoEdicion
                    ? 'Déjala vacía para conservar la contraseña actual.'
                    : 'Entre 6 y 20 caracteres.'}
                </div>
                <div className="campo-error">{errores.contrasena}</div>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="fechaNacimiento" className="form-label">Fecha de nacimiento (opcional)</label>
                <input id="fechaNacimiento" type="date" name="fechaNacimiento"
                  className="form-control" value={formulario.fechaNacimiento}
                  onChange={actualizarCampo} />
                <div className="campo-error">{errores.fechaNacimiento}</div>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="telefono" className="form-label">Teléfono (opcional)</label>
              <input id="telefono" type="tel" name="telefono" maxLength={15}
                className="form-control" value={formulario.telefono}
                onChange={actualizarCampo} />
              <div className="campo-error">{errores.telefono}</div>
            </div>

            <div className="mb-3">
              <label htmlFor="tipoUsuario" className="form-label">Tipo de usuario</label>
              <select id="tipoUsuario" name="tipoUsuario" className="form-select"
                value={formulario.tipoUsuario} onChange={actualizarCampo}>
                <option value="">-- Seleccione el tipo --</option>
                {tiposUsuario.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
              <div className="campo-error">{errores.tipoUsuario}</div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="region" className="form-label">Región</label>
                <select id="region" name="region" className="form-select"
                  value={formulario.region} onChange={actualizarCampo}>
                  <option value="">-- Seleccione la región --</option>
                  {regionesComunas.map((item, index) => (
                    <option key={item.region} value={index}>{item.region}</option>
                  ))}
                </select>
                <div className="campo-error">{errores.region}</div>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="comuna" className="form-label">Comuna</label>
                <select id="comuna" name="comuna" className="form-select"
                  disabled={!regionSeleccionada} value={formulario.comuna}
                  onChange={actualizarCampo}>
                  <option value="">-- Seleccione la comuna --</option>
                  {comunasDisponibles.map(comuna => (
                    <option key={comuna} value={comuna}>{comuna}</option>
                  ))}
                </select>
                <div className="campo-error">{errores.comuna}</div>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="direccion" className="form-label">Dirección</label>
              <input id="direccion" type="text" name="direccion" maxLength={300}
                className="form-control" value={formulario.direccion}
                onChange={actualizarCampo} />
              <div className="campo-error">{errores.direccion}</div>
            </div>

            {mensaje && (
              <div className="mb-3 fw-semibold"
                style={{ color: mensaje.startsWith('¡') ? 'var(--azul-medio)' : '#b3261e' }}>
                {mensaje}
              </div>
            )}

            <button type="submit" className="btn btn-enviar" disabled={guardando}>
              {guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Guardar usuario'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default UsuarioFormulario