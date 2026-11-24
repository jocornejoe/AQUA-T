import MiCuenta from '../pages/MiCuenta'

import {
  montar,
  clic,
  boton,
  limpiarAlmacenamiento,
  iniciarSesionComo,
  esperarActualizacion
} from './utils'

describe('Vista MiCuenta', () => {
  let vista
  let peticiones
  let historial

  const boleta = {
    id: 17,
    fecha: '2026-11-24T12:00:00',
    estado: 'Confirmado',
    subtotal: 120000,
    total: 108000,
    clienteNombre: 'Cliente de prueba',
    clienteTelefono: '900000000',
    envioDireccion: 'Calle de prueba 123',
    envioComuna: 'Santiago',
    envioRegion: 'Región Metropolitana de Santiago',
    detalles: [
      {
        id: 1,
        productoId: 'filtro-vulcano-20',
        productoNombre: 'Filtro VC VULCANO 20',
        cantidad: 1,
        precioUnitario: 120000,
        subtotal: 120000
      }
    ]
  }

  beforeEach(() => {
    limpiarAlmacenamiento()
    vista = null
    peticiones = []
    historial = [boleta]

    window.fetch.and.callFake(async (url, opciones = {}) => {
      const ruta = new URL(String(url), 'http://localhost').pathname
      const metodo = (opciones.method || 'GET').toUpperCase()

      peticiones.push({ ruta, metodo, opciones })

      if (ruta === '/api/v1/boletas/mias' && metodo === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => historial
        }
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: `Ruta no simulada: ${ruta}` })
      }
    })
  })

  afterEach(() => {
    if (vista) {
      vista.desmontar()
      vista = null
    }
  })

  it('permite al Cliente consultar su perfil, sus boletas y el detalle', async () => {
    iniciarSesionComo('Cliente', 'Cliente de prueba')

    vista = montar(<MiCuenta />, { ruta: '/mi-cuenta' })
    const c = vista.contenedor

    expect(c.querySelector('h1').textContent).toBe('Mi cuenta')
    expect(c.textContent).toContain('Información de mi cuenta')
    expect(c.textContent).toContain('test@duoc.cl')
    expect(boton(c, 'Mis compras')).toBeDefined()

    clic(boton(c, 'Mis compras'))
    await esperarActualizacion()

    expect(c.textContent).toContain('Mi historial de compras')
    expect(c.textContent).toContain('Boleta #17')
    expect(c.textContent).toContain('Confirmado')

    const consulta = peticiones.find(p => p.ruta === '/api/v1/boletas/mias')
    expect(consulta).toBeDefined()
    expect(consulta.metodo).toBe('GET')
    expect(consulta.opciones.headers.Authorization).toContain('Bearer ')

    clic(boton(c, 'Ver detalle'))

    expect(c.textContent).toContain('Productos de la compra')
    expect(c.textContent).toContain('Filtro VC VULCANO 20')
    expect(c.textContent).toContain('Calle de prueba 123')
    expect(c.textContent).toContain('Descuento')

    clic(boton(c, 'Ocultar detalle'))
    expect(c.textContent).not.toContain('Productos de la compra')
  })

  it('muestra el estado vacío cuando el Cliente no tiene compras', async () => {
    historial = []
    iniciarSesionComo('Cliente')

    vista = montar(<MiCuenta />, { ruta: '/mi-cuenta' })
    const c = vista.contenedor

    clic(boton(c, 'Mis compras'))
    await esperarActualizacion()

    expect(c.textContent).toContain('Aún no tienes compras registradas')
    expect(c.querySelector('a[href="/productos"]')).not.toBeNull()
    expect(boton(c, 'Ver detalle')).toBeUndefined()
  })

  it('no ofrece historial de compras al Administrador', () => {
    iniciarSesionComo('Administrador', 'Administrador de prueba')

    vista = montar(<MiCuenta />, { ruta: '/mi-cuenta' })
    const c = vista.contenedor

    expect(c.textContent).toContain('Información de mi cuenta')
    expect(boton(c, 'Mis compras')).toBeUndefined()
    expect(c.querySelector('a[href="/admin"]')).not.toBeNull()
    expect(peticiones.length).toBe(0)
  })
})