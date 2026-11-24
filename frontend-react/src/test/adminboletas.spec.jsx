import AdminBoletas from '../pages/admin/AdminBoletas'

import {
  montar,
  clic,
  boton,
  escribir,
  limpiarAlmacenamiento,
  iniciarSesionComo,
  esperarActualizacion
} from './utils'

describe('Vista AdminBoletas', () => {
  let vista
  let peticiones
  let estadoActual

  const resumen = {
    id: 7,
    fecha: '2026-11-24T10:30:00',
    clienteNombre: 'Cliente de prueba',
    total: 240000,
    estado: 'Confirmado'
  }

  function responder(datos, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => datos
    }
  }

  beforeEach(() => {
    limpiarAlmacenamiento()
    vista = null
    peticiones = []
    estadoActual = 'Confirmado'

    window.fetch.and.callFake(async (url, opciones = {}) => {
      const ruta = new URL(String(url), 'http://localhost').pathname
      const metodo = (opciones.method || 'GET').toUpperCase()

      peticiones.push({ ruta, metodo, opciones })

      if (ruta === '/api/v1/boletas' && metodo === 'GET') {
        return responder([{ ...resumen, estado: estadoActual }])
      }

      if (ruta === '/api/v1/boletas/7' && metodo === 'GET') {
        return responder({
          ...resumen,
          estado: estadoActual,
          clienteCorreo: 'cliente@ejemplo.cl',
          clienteTelefono: '',
          envioDireccion: 'Calle de prueba 123',
          envioComuna: 'Santiago',
          envioRegion: 'Región Metropolitana de Santiago',
          subtotal: 240000,
          detalles: [{
            id: 11,
            productoId: 'filtro-vulcano-20',
            productoNombre: 'Filtro VC VULCANO 20',
            cantidad: 2,
            precioUnitario: 120000,
            subtotal: 240000
          }]
        })
      }

      if (ruta === '/api/v1/boletas/7/estado' && metodo === 'PATCH') {
        estadoActual = JSON.parse(opciones.body).estado
        return responder({ ...resumen, estado: estadoActual })
      }

      return responder({ error: `Ruta no simulada: ${ruta}` }, 404)
    })
  })

  afterEach(() => {
    if (vista) {
      vista.desmontar()
      vista = null
    }
  })

  it('permite al Administrador consultar una boleta y actualizar su estado', async () => {
    iniciarSesionComo('Administrador')

    vista = montar(<AdminBoletas />, { ruta: '/admin/boletas' })
    await esperarActualizacion()

    const c = vista.contenedor

    expect(c.querySelector('h1').textContent).toBe('Órdenes y boletas')
    expect(c.querySelectorAll('.admin-tabla tbody tr').length).toBe(1)
    expect(c.textContent).toContain('Cliente de prueba')

    clic(boton(c, 'Ver detalle'))
    await esperarActualizacion()

    expect(c.textContent).toContain('Boleta #7')
    expect(c.textContent).toContain('Filtro VC VULCANO 20')
    expect(c.textContent).toContain('cliente@ejemplo.cl')
    expect(c.querySelector('#estadoBoleta')).not.toBeNull()

    escribir(c.querySelector('#estadoBoleta'), 'Enviado')
    clic(boton(c, 'Guardar estado'))
    await esperarActualizacion()

    expect(c.textContent).toContain('Estado actualizado correctamente.')
    expect(c.querySelector('.admin-tabla tbody tr').textContent).toContain('Enviado')

    const actualizacion = peticiones.find(p => p.metodo === 'PATCH')
    expect(actualizacion).toBeDefined()
    expect(actualizacion.ruta).toBe('/api/v1/boletas/7/estado')
    expect(actualizacion.opciones.headers.Authorization).toContain('Bearer ')
    expect(JSON.parse(actualizacion.opciones.body)).toEqual({ estado: 'Enviado' })
  })

  it('permite al Vendedor consultar el detalle sin mostrar controles de edición', async () => {
    iniciarSesionComo('Vendedor')

    vista = montar(<AdminBoletas />, { ruta: '/admin/boletas' })
    await esperarActualizacion()

    const c = vista.contenedor

    expect(c.querySelectorAll('.admin-tabla tbody tr').length).toBe(1)
    expect(c.textContent).toContain('Cliente de prueba')

    clic(boton(c, 'Ver detalle'))
    await esperarActualizacion()

    expect(c.textContent).toContain('Boleta #7')
    expect(c.textContent).toContain('Filtro VC VULCANO 20')
    expect(c.querySelector('#estadoBoleta')).toBeNull()
    expect(boton(c, 'Guardar estado')).toBeUndefined()
    expect(peticiones.some(p => p.metodo === 'PATCH')).toBeFalse()

    const consultas = peticiones.filter(p => p.metodo === 'GET')
    expect(consultas.length).toBe(2)
    expect(consultas[0].opciones.headers.Authorization).toContain('Bearer ')
    expect(consultas[1].opciones.headers.Authorization).toContain('Bearer ')
  })
})