import Registro from '../pages/Registro'

import { regionesComunas } from '../data/regiones'

import {
  normalizarRun,
  runValido,
  validarRun
} from '../utils/validacionesRegistro'

import {
  montar,
  llenar,
  clic,
  boton,
  limpiarAlmacenamiento,
  esperarActualizacion
} from './utils'

describe('Registro con Spring Boot', () => {
  let vista
  let peticionRegistrada

  beforeEach(() => {
    limpiarAlmacenamiento()

    vista = null
    peticionRegistrada = null

    window.fetch.and.callFake(
      async (url, opciones = {}) => {
        if (
          String(url).endsWith('/api/v1/auth/registro') &&
          opciones.method === 'POST'
        ) {
          peticionRegistrada = JSON.parse(
            opciones.body
          )

          return {
            ok: true,
            status: 201,
            json: async () => ({
              id: 4,
              nombre: peticionRegistrada.nombre,
              tipoUsuario: 'Cliente'
            })
          }
        }

        return {
          ok: false,
          status: 404,
          json: async () => ({
            error: 'Ruta no simulada'
          })
        }
      }
    )
  })

  afterEach(() => {
    if (vista) {
      vista.desmontar()
      vista = null
    }
  })

  it('acepta RUN con puntos y guion al normalizarlo', () => {
    expect(
      normalizarRun('12.345.678-5')
    ).toBe('123456785')

    expect(
      runValido('12.345.678-5')
    ).toBeTrue()

    expect(
      runValido('12345678-5')
    ).toBeTrue()

    // El formulario exige escribir el RUN sin puntos.
    expect(
      validarRun('12.345.678-9')
    ).toContain('sin puntos')

    // Con formato correcto, comprueba el dígito.
    expect(
      validarRun('12345678-9')
    ).toContain('Dígito verificador incorrecto')
  })

  it('registra un Cliente en Spring Boot', async () => {
    vista = montar(<Registro />)

    const contenedor = vista.contenedor

    llenar(contenedor, {
      run: '12.345.678-5',
      nombre: 'Alex',
      apellidos: 'Turner',
      correo: 'turner.alex@gmail.com',
      contrasena: 'clave123',
      confirmarContrasena: 'clave123',
      telefono: '912345678',
      fechaNacimiento: '',
      region: '0',
      comuna: regionesComunas[0].comunas[0],
      direccion: 'Calle Humbug 123'
    })

    clic(boton(contenedor, 'Registrar'))

    await esperarActualizacion()

    expect(peticionRegistrada).not.toBeNull()

    expect(
      peticionRegistrada.run
    ).toBe('123456785')

    expect(
      peticionRegistrada.fechaNacimiento
    ).toBeNull()

    expect(
      peticionRegistrada.tipoUsuario
    ).toBeUndefined()

    expect(contenedor.textContent)
      .toContain('¡Registro exitoso!')

    expect(
      contenedor.querySelector('[name="run"]').value
    ).toBe('')
  })

  it('rechaza un RUN incorrecto', async () => {
    vista = montar(<Registro />)

    const contenedor = vista.contenedor

    llenar(contenedor, {
      run: '12.345.678-9',
      nombre: 'Alex',
      apellidos: 'Turner',
      correo: 'turner.alex@gmail.com',
      contrasena: 'clave123',
      confirmarContrasena: 'clave123',
      region: '0',
      comuna: regionesComunas[0].comunas[0],
      direccion: 'Calle Humbug 123'
    })

    clic(boton(contenedor, 'Registrar'))

    await esperarActualizacion()

    expect(peticionRegistrada).toBeNull()

    expect(contenedor.textContent)
      .toContain('Dígito verificador incorrecto')

    expect(contenedor.textContent)
      .toContain('para 12345678 corresponde 5')
  })
})