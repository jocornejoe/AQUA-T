package com.aquat.api.service;

import com.aquat.api.dto.BoletaRequest;
import com.aquat.api.dto.BoletaResponse;
import com.aquat.api.dto.ItemRequest;

import com.aquat.api.exception.BusinessException;
import com.aquat.api.exception.ResourceNotFoundException;

import com.aquat.api.model.Boleta;
import com.aquat.api.model.Categoria;
import com.aquat.api.model.DetalleBoleta;
import com.aquat.api.model.Producto;
import com.aquat.api.model.Rol;
import com.aquat.api.model.Usuario;

import com.aquat.api.repository.BoletaRepository;
import com.aquat.api.repository.ProductoRepository;
import com.aquat.api.repository.UsuarioRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoletaServiceTest {

    @Mock
    private BoletaRepository boletaRepository;

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private BoletaService boletaService;

    private Usuario usuario() {
        Usuario u = new Usuario();
        u.setId(1L);
        u.setNombre("Ana");
        u.setApellidos("Perez");
        u.setCorreo("ana@gmail.com");
        u.setRol(Rol.CLIENTE);
        return u;
    }

    private void prepararUsuario() {
        when(
                usuarioRepository.findByCorreoIgnoreCase(
                        "ana@gmail.com"
                )
        ).thenReturn(Optional.of(usuario()));
    }

    private Producto producto(
            String id,
            String nombre,
            String precio,
            int stock
    ) {
        Categoria categoria = new Categoria();
        categoria.setNombre("Filtros");

        Producto p = new Producto();
        p.setId(id);
        p.setNombre(nombre);
        p.setPrecio(new BigDecimal(precio));
        p.setStock(stock);
        p.setCategoria(categoria);

        return p;
    }

    private BoletaRequest solicitud(
            List<ItemRequest> items,
            String cupon
    ) {
        return new BoletaRequest(
                "Ana Perez",
                "ana@gmail.com",
                "+56911111111",
                "Region Metropolitana de Santiago",
                "Santiago",
                "Calle 123",
                items,
                cupon
        );
    }

    private BoletaRequest solicitud(
            String productoId,
            int cantidad
    ) {
        return solicitud(
                List.of(
                        new ItemRequest(
                                productoId,
                                cantidad
                        )
                ),
                null
        );
    }

    private void prepararGuardado() {
        when(
                boletaRepository.save(any(Boleta.class))
        ).thenAnswer(
                invocacion -> invocacion.getArgument(0)
        );
    }

    private Boleta boletaExistente(
            Producto producto,
            int cantidad,
            String estado
    ) {
        Boleta boleta = new Boleta();

        boleta.setId(9L);
        boleta.setUsuario(usuario());
        boleta.setClienteNombre("Ana Perez");
        boleta.setClienteCorreo("ana@gmail.com");
        boleta.setEstado(estado);

        BigDecimal subtotal =
                producto.getPrecio().multiply(
                        BigDecimal.valueOf(cantidad)
                );

        boleta.setSubtotal(subtotal);
        boleta.setTotal(subtotal);

        DetalleBoleta detalle = new DetalleBoleta();

        detalle.setProducto(producto);
        detalle.setCantidad(cantidad);
        detalle.setPrecioUnitario(
                producto.getPrecio()
        );

        boleta.agregarDetalle(detalle);

        return boleta;
    }

    @Test
    void crearCalculaTotalConPreciosDeLaBaseYDescuentaStock() {
        prepararUsuario();

        Producto filtro = producto(
                "filtro-1",
                "Filtro 1",
                "10000",
                5
        );

        when(
                productoRepository.buscarParaActualizarStock(
                        "filtro-1"
                )
        ).thenReturn(Optional.of(filtro));

        prepararGuardado();

        BoletaResponse respuesta = boletaService.crear(
                solicitud("filtro-1", 2),
                "ana@gmail.com"
        );

        assertEquals(
                0,
                new BigDecimal("20000")
                        .compareTo(respuesta.total())
        );

        assertEquals(1, respuesta.detalles().size());
        assertEquals(3, filtro.getStock());
        assertEquals("Confirmado", respuesta.estado());

        verify(productoRepository)
                .buscarParaActualizarStock("filtro-1");

        verify(boletaRepository)
                .save(any(Boleta.class));
    }

    @Test
    void crearRechazaLaCompraSiNoHayStockSuficiente() {
        prepararUsuario();

        Producto filtro = producto(
                "filtro-1",
                "Filtro 1",
                "10000",
                1
        );

        when(
                productoRepository.buscarParaActualizarStock(
                        "filtro-1"
                )
        ).thenReturn(Optional.of(filtro));

        assertThrows(
                BusinessException.class,
                () -> boletaService.crear(
                        solicitud("filtro-1", 2),
                        "ana@gmail.com"
                )
        );

        assertEquals(1, filtro.getStock());

        verify(
                boletaRepository,
                never()
        ).save(any(Boleta.class));
    }

    @Test
    void crearFallaSiElProductoNoExiste() {
        prepararUsuario();

        when(
                productoRepository.buscarParaActualizarStock(
                        "no-existe"
                )
        ).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> boletaService.crear(
                        solicitud("no-existe", 1),
                        "ana@gmail.com"
                )
        );

        verify(
                boletaRepository,
                never()
        ).save(any(Boleta.class));
    }

    @Test
    void crearAgrupaProductosRepetidos() {
        prepararUsuario();

        Producto filtro = producto(
                "filtro-1",
                "Filtro 1",
                "10000",
                10
        );

        when(
                productoRepository.buscarParaActualizarStock(
                        "filtro-1"
                )
        ).thenReturn(Optional.of(filtro));

        prepararGuardado();

        BoletaRequest request = solicitud(
                List.of(
                        new ItemRequest("filtro-1", 2),
                        new ItemRequest("filtro-1", 3)
                ),
                null
        );

        BoletaResponse respuesta = boletaService.crear(
                request,
                "ana@gmail.com"
        );

        assertEquals(5, filtro.getStock());
        assertEquals(1, respuesta.detalles().size());

        assertEquals(
                5,
                respuesta.detalles().get(0).cantidad()
        );

        assertEquals(
                0,
                new BigDecimal("50000")
                        .compareTo(respuesta.total())
        );

        verify(
                productoRepository,
                times(1)
        ).buscarParaActualizarStock("filtro-1");
    }

    @Test
    void crearAplicaDescuentoAqua10() {
        prepararUsuario();

        Producto filtro = producto(
                "filtro-1",
                "Filtro 1",
                "10000",
                5
        );

        when(
                productoRepository.buscarParaActualizarStock(
                        "filtro-1"
                )
        ).thenReturn(Optional.of(filtro));

        prepararGuardado();

        BoletaRequest request = solicitud(
                List.of(new ItemRequest("filtro-1", 2)),
                "AQUA10"
        );

        BoletaResponse respuesta = boletaService.crear(
                request,
                "ana@gmail.com"
        );

        assertEquals(
                0,
                new BigDecimal("20000")
                        .compareTo(respuesta.subtotal())
        );

        assertEquals(
                0,
                new BigDecimal("18000")
                        .compareTo(respuesta.total())
        );

        assertEquals(3, filtro.getStock());
    }

    @Test
    void crearAplicaDescuentoVerano20() {
        prepararUsuario();

        Producto filtro = producto(
                "filtro-1",
                "Filtro 1",
                "10000",
                5
        );

        when(
                productoRepository.buscarParaActualizarStock(
                        "filtro-1"
                )
        ).thenReturn(Optional.of(filtro));

        prepararGuardado();

        BoletaRequest request = solicitud(
                List.of(new ItemRequest("filtro-1", 2)),
                "VERANO20"
        );

        BoletaResponse respuesta = boletaService.crear(
                request,
                "ana@gmail.com"
        );

        assertEquals(
                0,
                new BigDecimal("16000")
                        .compareTo(respuesta.total())
        );

        assertEquals(3, filtro.getStock());
    }

    @Test
    void crearRechazaCuponInvalido() {
        BoletaRequest request = solicitud(
                List.of(new ItemRequest("filtro-1", 1)),
                "CUPON_FALSO"
        );

        assertThrows(
                BusinessException.class,
                () -> boletaService.crear(
                        request,
                        "ana@gmail.com"
                )
        );

        verify(
                boletaRepository,
                never()
        ).save(any(Boleta.class));
    }

    @Test
    void crearRechazaUnaCompraSinProductos() {
        prepararUsuario();

        BoletaRequest request = solicitud(
                List.of(),
                null
        );

        assertThrows(
                BusinessException.class,
                () -> boletaService.crear(
                        request,
                        "ana@gmail.com"
                )
        );

        verify(
                boletaRepository,
                never()
        ).save(any(Boleta.class));
    }

    @Test
    void cancelarReponeElStockUnaSolaVez() {
        Producto filtro = producto(
                "filtro-1",
                "Filtro 1",
                "10000",
                3
        );

        Boleta boleta = boletaExistente(
                filtro,
                2,
                "Confirmado"
        );

        when(
                boletaRepository.buscarParaCambiarEstado(9L)
        ).thenReturn(Optional.of(boleta));

        when(
                productoRepository.buscarParaActualizarStock(
                        "filtro-1"
                )
        ).thenReturn(Optional.of(filtro));

        when(
                boletaRepository.save(boleta)
        ).thenReturn(boleta);

        BoletaResponse cancelada =
                boletaService.cambiarEstado(
                        9L,
                        "Cancelado"
                );

        assertEquals("Cancelado", cancelada.estado());
        assertEquals(5, filtro.getStock());

        // Repetir la cancelacion no repone nuevamente.
        BoletaResponse repetida =
                boletaService.cambiarEstado(
                        9L,
                        "Cancelado"
                );

        assertEquals("Cancelado", repetida.estado());
        assertEquals(5, filtro.getStock());

        verify(
                productoRepository,
                times(1)
        ).buscarParaActualizarStock("filtro-1");

        verify(
                boletaRepository,
                times(1)
        ).save(boleta);
    }

    @Test
    void noPermiteReactivarUnaBoletaCancelada() {
        Producto filtro = producto(
                "filtro-1",
                "Filtro 1",
                "10000",
                5
        );

        Boleta boleta = boletaExistente(
                filtro,
                2,
                "Cancelado"
        );

        when(
                boletaRepository.buscarParaCambiarEstado(9L)
        ).thenReturn(Optional.of(boleta));

        assertThrows(
                BusinessException.class,
                () -> boletaService.cambiarEstado(
                        9L,
                        "Confirmado"
                )
        );

        assertEquals(5, filtro.getStock());

        verify(
                boletaRepository,
                never()
        ).save(any(Boleta.class));
    }

    @Test
    void noPermiteCancelarUnaBoletaEntregada() {
        Producto filtro = producto(
                "filtro-1",
                "Filtro 1",
                "10000",
                5
        );

        Boleta boleta = boletaExistente(
                filtro,
                2,
                "Entregado"
        );

        when(
                boletaRepository.buscarParaCambiarEstado(9L)
        ).thenReturn(Optional.of(boleta));

        assertThrows(
                BusinessException.class,
                () -> boletaService.cambiarEstado(
                        9L,
                        "Cancelado"
                )
        );

        assertEquals(5, filtro.getStock());

        verify(
                boletaRepository,
                never()
        ).save(any(Boleta.class));
    }

    @Test
    void cambiarEstadoRechazaEstadosInvalidos() {
        assertThrows(
                BusinessException.class,
                () -> boletaService.cambiarEstado(
                        1L,
                        "Inventado"
                )
        );

        verifyNoInteractions(boletaRepository);
    }

    @Test
    void cambiarEstadoFallaSiBoletaNoExiste() {
        when(
                boletaRepository.buscarParaCambiarEstado(99L)
        ).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> boletaService.cambiarEstado(
                        99L,
                        "Cancelado"
                )
        );
    }
}