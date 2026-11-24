import { Routes, Route } from 'react-router-dom'

import Checkout from '../pages/Checkout'
import CompraExitosa from '../pages/CompraExitosa'

import { regionesComunas } from '../data/regiones'
import { obtenerCarrito } from '../services/carritoService'

import {
  montar,
  llenar,
  clic,
  boton,
  limpiarAlmacenamiento,
  cargarCarrito,
  iniciarSesionComo,
  PRODUCTO_EJEMPLO,
  esperarActualizacion
} from './utils'

describe('Vista Checkout', () => {
  let vista

  beforeEach(() => {
    limpiarAlmacenamiento()
    vista = null
  })

  afterEach(() => {
    if (vista) {
      vista.desmontar()
      vista = null
    }
  })

  function montarCheckout() {
    vista = montar(
      <Routes>
        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/compra-exitosa"
          element={<CompraExitosa />}
        />
      </Routes>,
      { ruta: '/checkout' }
    )

    return vista.contenedor
  }

  function completarDatos(contenedor) {
    llenar(contenedor, {
      nombre: 'Paul Banks',
      correo: 'banks@gmail.com',
      region: '0',
      comuna: regionesComunas[0].comunas[0],
      direccion: 'Calle El Pintor 123'
    })
  }

  function simularBoletas(status, datos, alRecibir) {
    window.fetch.and.callFake(async (url, opciones = {}) => {
      const ruta = new URL(
        String(url),
        'http://localhost'
      ).pathname

      if (
        ruta === '/api/v1/boletas' &&
        opciones.method === 'POST'
      ) {
        alRecibir?.(opciones)

        return {
          ok: status >= 200 && status < 300,
          status,
          json: async () => datos
        }
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Ruta no simulada'
        })
      }
    })
  }

  it(
    'crea la boleta, vacía el carrito y muestra la compra exitosa',
    async () => {
      cargarCarrito([PRODUCTO_EJEMPLO])
      iniciarSesionComo('Cliente')

      let peticionEnviada = null

      simularBoletas(
        201,
        {
          id: 7,
          subtotal: 120000,
          total: 120000,
          estado: 'Confirmado'
        },
        opciones => {
          peticionEnviada = opciones
        }
      )

      const c = montarCheckout()

      completarDatos(c)

      clic(boton(c, 'Confirmar compra'))

      await esperarActualizacion()

      expect(peticionEnviada).not.toBeNull()

      expect(peticionEnviada.method).toBe('POST')

      expect(
        peticionEnviada.headers.Authorization
      ).toContain('Bearer ')

      const cuerpo = JSON.parse(
        peticionEnviada.body
      )

      expect(cuerpo.clienteNombre).toBe('Paul Banks')
      expect(cuerpo.clienteCorreo).toBe('banks@gmail.com')

      expect(cuerpo.items).toEqual([
        {
          productoId: PRODUCTO_EJEMPLO.id,
          cantidad: 1
        }
      ])

      expect(obtenerCarrito().length).toBe(0)

      expect(c.querySelector('h1').textContent)
        .toContain('¡Compra registrada con éxito!')

      expect(c.textContent)
        .toContain('Número de boleta:')

      expect(c.textContent).toContain('#7')
    }
  )

  it(
    'conserva el carrito cuando Spring Boot rechaza la compra',
    async () => {
      cargarCarrito([PRODUCTO_EJEMPLO])
      iniciarSesionComo('Cliente')

      simularBoletas(
        409,
        {
          error: 'Stock insuficiente para el producto'
        }
      )

      const c = montarCheckout()

      completarDatos(c)

      clic(boton(c, 'Confirmar compra'))

      await esperarActualizacion()

      expect(c.textContent)
        .toContain('Stock insuficiente')

      expect(obtenerCarrito().length).toBe(1)

      expect(c.textContent)
        .toContain('Finalizar compra')
    }
  )

  it(
    'solicita iniciar sesión sin perder el carrito',
    () => {
      cargarCarrito([PRODUCTO_EJEMPLO])

      const c = montarCheckout()

      expect(c.textContent)
        .toContain('Inicia sesión para comprar')

      expect(
        c.querySelector('a[href="/login"]')
      ).not.toBeNull()

      expect(obtenerCarrito().length).toBe(1)

      expect(
        boton(c, 'Confirmar compra')
      ).toBeUndefined()
    }
  )
})