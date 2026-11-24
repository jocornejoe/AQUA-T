import CompraExitosa from '../pages/CompraExitosa'
import { montar } from './utils'

describe('Vista CompraExitosa', () => {
  let vista

  afterEach(() => {
    if (vista) {
      vista.desmontar()
      vista = null
    }
  })

  it(
    'confirma la compra e indica el número de boleta',
    () => {
      vista = montar(
        <CompraExitosa />,
        {
          ruta: {
            pathname: '/compra-exitosa',
            state: {
              pedidoId: 7,
              subtotal: 120000,
              total: 108000
            }
          }
        }
      )

      const c = vista.contenedor

      expect(c.querySelector('h1').textContent)
        .toContain('¡Compra registrada con éxito!')

      expect(c.textContent)
        .toContain('Número de boleta:')

      expect(c.textContent)
        .toContain('Descuento:')

      expect(c.textContent)
        .toContain('Total de la boleta:')

      expect(
        c.querySelector('strong').textContent
      ).toBe('#7')
    }
  )
})