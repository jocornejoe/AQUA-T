import { Routes, Route } from 'react-router-dom'

import CompraFallida from '../pages/CompraFallida'
import Checkout from '../pages/Checkout'

import { obtenerCarrito } from '../services/carritoService'

import {
  montar,
  clic,
  limpiarAlmacenamiento,
  cargarCarrito,
  iniciarSesionComo,
  PRODUCTO_EJEMPLO
} from './utils'

describe('Vista CompraFallida', () => {
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

  function montarCompraFallida() {
    vista = montar(
      <Routes>
        <Route
          path="/compra-fallida"
          element={<CompraFallida />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />
      </Routes>,
      { ruta: '/compra-fallida' }
    )

    return vista.contenedor
  }

  it(
    'solicita login al reintentar una compra sin sesión',
    () => {
      cargarCarrito([PRODUCTO_EJEMPLO])

      const c = montarCompraFallida()

      expect(c.querySelector('h1').textContent)
        .toBe('No se pudo completar la compra')

      clic(
        c.querySelector(
          '.contacto-card a[href="/checkout"]'
        )
      )

      expect(c.textContent)
        .toContain('Inicia sesión para comprar')

      expect(c.textContent)
        .not.toContain('No se pudo completar la compra')

      expect(obtenerCarrito().length).toBe(1)
    }
  )

  it(
    'permite reintentar la compra cuando existe una sesión',
    () => {
      cargarCarrito([PRODUCTO_EJEMPLO])
      iniciarSesionComo('Cliente')

      const c = montarCompraFallida()

      clic(
        c.querySelector(
          '.contacto-card a[href="/checkout"]'
        )
      )

      expect(c.textContent)
        .toContain('Finalizar compra')

      expect(
        c.querySelector('button[type="submit"]')
          .textContent
      ).toContain('Confirmar compra')

      expect(obtenerCarrito().length).toBe(1)
    }
  )
})