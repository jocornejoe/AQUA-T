package com.aquat.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aquat.api.dto.BoletaRequest;
import com.aquat.api.dto.BoletaResponse;
import com.aquat.api.dto.ItemRequest;
import com.aquat.api.exception.BusinessException;
import com.aquat.api.exception.ResourceNotFoundException;
import com.aquat.api.model.Boleta;
import com.aquat.api.model.Categoria;
import com.aquat.api.model.Producto;
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

    private Producto producto(String id, String nombre, String precio, int stock) {
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

    private BoletaRequest solicitud(String productoId, int cantidad) {
        return new BoletaRequest("Ana Pérez", "ana@gmail.com", "+56911111111",
                "Región Metropolitana de Santiago", "Santiago", "Calle 123",
                List.of(new ItemRequest(productoId, cantidad)));
    }

    @Test
    void crearCalculaTotalConPreciosDeLaBaseYDescuentaStock() {
        Producto filtro = producto("filtro-1", "Filtro 1", "10000", 5);
        when(productoRepository.findById("filtro-1")).thenReturn(Optional.of(filtro));
        when(boletaRepository.save(any(Boleta.class))).thenAnswer(inv -> inv.getArgument(0));

        BoletaResponse respuesta = boletaService.crear(solicitud("filtro-1", 2), "ana@gmail.com");

        assertEquals(0, new BigDecimal("20000").compareTo(respuesta.total()));
        assertEquals(1, respuesta.detalles().size());
        assertEquals(3, filtro.getStock());
        assertEquals("Confirmado", respuesta.estado());
    }

    @Test
    void crearRechazaLaCompraSiNoHayStockSuficiente() {
        Producto filtro = producto("filtro-1", "Filtro 1", "10000", 1);
        when(productoRepository.findById("filtro-1")).thenReturn(Optional.of(filtro));

        assertThrows(BusinessException.class,
                () -> boletaService.crear(solicitud("filtro-1", 2), "ana@gmail.com"));

        assertEquals(1, filtro.getStock());
        verify(boletaRepository, never()).save(any());
    }

    @Test
    void crearFallaSiElProductoNoExiste() {
        when(productoRepository.findById("no-existe")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> boletaService.crear(solicitud("no-existe", 1), "ana@gmail.com"));
    }

    @Test
    void cambiarEstadoRechazaEstadosInvalidos() {
        assertThrows(BusinessException.class, () -> boletaService.cambiarEstado(1L, "Inventado"));
    }
}
