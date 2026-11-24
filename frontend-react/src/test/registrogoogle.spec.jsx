import RegistroGoogle from '../pages/RegistroGoogle'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { regionesComunas } from '../data/regiones'

import {
  act,
  montar,
  llenar,
  clic,
  boton,
  limpiarAlmacenamiento,
  esperarActualizacion
} from './utils'

function crearJwt(datos) {
  const encabezado = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const carga = btoa(JSON.stringify(datos))
  return `${encabezado}.${carga}.firma-simulada`
}

describe('Vista RegistroGoogle', () => {
  let vista
  let responderGoogle
  let googleAnterior
  let peticionRegistro

  beforeEach(() => {
    limpiarAlmacenamiento()
    vista = null
    responderGoogle = null
    peticionRegistro = null
    googleAnterior = window.google

    window.google = {
      accounts: {
        id: {
          initialize: jasmine.createSpy('initializeGoogle').and.callFake(
            ({ callback }) => { responderGoogle = callback }
          ),
          renderButton: jasmine.createSpy('renderButtonGoogle')
        }
      }
    }

    const agregarOriginal = document.body.appendChild.bind(document.body)
    spyOn(document.body, 'appendChild').and.callFake(elemento => {
      if (
        elemento.tagName === 'SCRIPT' &&
        elemento.src.includes('accounts.google.com/gsi/client')
      ) {
        elemento.removeAttribute('src')
        const agregado = agregarOriginal(elemento)
        elemento.onload?.()
        return agregado
      }
      return agregarOriginal(elemento)
    })
  })

  afterEach(() => {
    if (vista) {
      vista.desmontar()
      vista = null
    }
    window.google = googleAnterior
  })

  function mostrarVista() {
    vista = montar(
      <GoogleOAuthProvider clientId="cliente-google-de-prueba">
        <RegistroGoogle />
      </GoogleOAuthProvider>,
      { ruta: '/registro/google' }
    )
    return vista.contenedor
  }

  function elegirCuentaGoogle() {
    expect(responderGoogle).toEqual(jasmine.any(Function))
    const credencial = crearJwt({
      email: 'cliente.google@gmail.com',
      given_name: 'Alex',
      family_name: 'Turner'
    })

    act(() => responderGoogle({ credential: credencial }))
    return credencial
  }

  it('solicita seleccionar Google antes de mostrar los datos personales', () => {
    const c = mostrarVista()

    expect(c.textContent).toContain('Registro con Google')
    expect(c.textContent).toContain('Primero, selecciona tu cuenta')
    expect(c.querySelector('#googleRun')).toBeNull()
    expect(c.querySelector('a[href="/registro"]')).not.toBeNull()
    expect(sessionStorage.getItem('aquaT_sesion')).toBeNull()
  })

  it('valida el RUN antes de enviar los datos a Spring Boot', async () => {
    const c = mostrarVista()
    elegirCuentaGoogle()
    await esperarActualizacion()

    expect(c.textContent).toContain('Cuenta Google seleccionada')
    expect(c.querySelector('#googleCorreo').value).toBe('cliente.google@gmail.com')
    expect(c.querySelector('#googleNombre').value).toBe('Alex')
    expect(c.querySelector('#googleApellidos').value).toBe('Turner')

    llenar(c, {
      run: '12345678-9',
      region: '0',
      comuna: regionesComunas[0].comunas[0],
      direccion: 'Calle de Prueba 123'
    })

    clic(boton(c, 'Crear cuenta con Google'))
    await esperarActualizacion()

    expect(c.textContent).toContain('Dígito verificador incorrecto')
    expect(window.fetch).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('aquaT_sesion')).toBeNull()
  })

  it('registra un Cliente y guarda la sesión JWT al recibir respuesta válida', async () => {
    window.fetch.and.callFake(async (url, opciones = {}) => {
      const ruta = new URL(String(url), 'http://localhost').pathname
      if (ruta === '/api/v1/auth/google/registro' && opciones.method === 'POST') {
        peticionRegistro = { ruta, opciones, datos: JSON.parse(opciones.body) }
        return {
          ok: true,
          status: 201,
          json: async () => ({
            token: crearJwt({
              sub: 'cliente.google@gmail.com',
              exp: Math.floor(Date.now() / 1000) + 3600
            }),
            usuario: {
              id: 24,
              correo: 'cliente.google@gmail.com',
              nombre: 'Alex',
              apellidos: 'Turner',
              tipoUsuario: 'Cliente'
            }
          })
        }
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: `Ruta no simulada: ${ruta}` })
      }
    })

    const c = mostrarVista()
    const credencial = elegirCuentaGoogle()
    await esperarActualizacion()

    llenar(c, {
      run: '12345678-5',
      region: '0',
      comuna: regionesComunas[0].comunas[0],
      direccion: 'Calle de Prueba 123'
    })

    clic(boton(c, 'Crear cuenta con Google'))
    await esperarActualizacion()

    expect(peticionRegistro).not.toBeNull()
    expect(peticionRegistro.datos.credential).toBe(credencial)
    expect(peticionRegistro.datos.run).toBe('123456785')
    expect(peticionRegistro.datos.region).toBe(regionesComunas[0].region)
    expect(peticionRegistro.datos.fechaNacimiento).toBeNull()
    expect(peticionRegistro.datos.contrasena).toBeUndefined()

    const sesion = JSON.parse(sessionStorage.getItem('aquaT_sesion'))
    expect(sesion.correo).toBe('cliente.google@gmail.com')
    expect(sesion.tipoUsuario).toBe('Cliente')
    expect(sesion.token).toBeTruthy()
  })
})