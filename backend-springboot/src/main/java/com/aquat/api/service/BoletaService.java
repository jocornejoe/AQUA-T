package com.aquat.api.service;

import com.aquat.api.dto.BoletaRequest;
import com.aquat.api.dto.BoletaResponse;
import com.aquat.api.dto.ItemRequest;
import com.aquat.api.exception.BusinessException;
import com.aquat.api.exception.ResourceNotFoundException;
import com.aquat.api.model.Boleta;
import com.aquat.api.model.DetalleBoleta;
import com.aquat.api.model.Producto;
import com.aquat.api.model.Usuario;
import com.aquat.api.repository.BoletaRepository;
import com.aquat.api.repository.ProductoRepository;
import com.aquat.api.repository.UsuarioRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BoletaService {

    private static final Set<String> ESTADOS = Set.of(
            "Confirmado",
            "Enviado",
            "Entregado",
            "Cancelado"
    );

    private final BoletaRepository boletaRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;

    public BoletaService(
            BoletaRepository boletaRepository,
            ProductoRepository productoRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.boletaRepository = boletaRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public BoletaResponse crear(
            BoletaRequest request,
            String correoUsuario
    ) {
        BigDecimal multiplicador = multiplicadorCupon(
                request.cupon()
        );

        Usuario usuario = usuarioRepository
                .findByCorreoIgnoreCase(correoUsuario)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "El usuario de la sesión no existe"
                ));

        if (request.items() == null ||
                request.items().isEmpty()) {
            throw new BusinessException(
                    "La compra debe contener productos",
                    HttpStatus.BAD_REQUEST
            );
        }

        /*
         * Agrupamos las cantidades de productos repetidos.
         * TreeMap mantiene los productos ordenados por ID,
         * reduciendo el riesgo de interbloqueos cuando
         * dos compras incluyen varios productos.
         */
        Map<String, Long> cantidades = new TreeMap<>();

        for (ItemRequest item : request.items()) {

            if (item == null ||
                    item.productoId() == null ||
                    item.productoId().isBlank() ||
                    item.cantidad() == null ||
                    item.cantidad() < 1) {
                throw new BusinessException(
                        "La compra contiene un producto o cantidad inválidos",
                        HttpStatus.BAD_REQUEST
                );
            }

            cantidades.merge(
                    item.productoId(),
                    item.cantidad().longValue(),
                    Long::sum
            );
        }

        Boleta boleta = new Boleta();

        boleta.setUsuario(usuario);
        boleta.setClienteNombre(
                request.clienteNombre().trim()
        );
        boleta.setClienteCorreo(
                request.clienteCorreo().trim()
        );
        boleta.setClienteTelefono(
                request.clienteTelefono()
        );
        boleta.setEnvioRegion(
                request.envioRegion()
        );
        boleta.setEnvioComuna(
                request.envioComuna()
        );
        boleta.setEnvioDireccion(
                request.envioDireccion()
        );

        BigDecimal subtotal = BigDecimal.ZERO;

        for (Map.Entry<String, Long> entrada
                : cantidades.entrySet()) {

            String productoId = entrada.getKey();
            long cantidadSolicitada = entrada.getValue();

            if (cantidadSolicitada > Integer.MAX_VALUE) {
                throw new BusinessException(
                        "La cantidad solicitada es demasiado grande",
                        HttpStatus.BAD_REQUEST
                );
            }

            int cantidad = (int) cantidadSolicitada;

            /*
             * El producto se bloquea hasta finalizar
             * la transacción. Otra compra esperará antes
             * de consultar y descontar su inventario.
             */
            Producto producto = productoRepository
                    .buscarParaActualizarStock(productoId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Producto no encontrado: " + productoId
                    ));

            if (producto.getStock() < cantidad) {
                throw new BusinessException(
                        "Stock insuficiente para " +
                        producto.getNombre() +
                        " (disponible: " +
                        producto.getStock() + ")",
                        HttpStatus.CONFLICT
                );
            }

            producto.setStock(
                    producto.getStock() - cantidad
            );

            DetalleBoleta detalle = new DetalleBoleta();

            detalle.setProducto(producto);
            detalle.setCantidad(cantidad);
            detalle.setPrecioUnitario(
                    producto.getPrecio()
            );

            boleta.agregarDetalle(detalle);

            subtotal = subtotal.add(
                    producto.getPrecio().multiply(
                            BigDecimal.valueOf(cantidad)
                    )
            );
        }

        BigDecimal total = subtotal
                .multiply(multiplicador)
                .setScale(2, RoundingMode.HALF_UP);

        boleta.setSubtotal(subtotal);
        boleta.setTotal(total);

        /*
         * El guardado de boleta y el descuento de
         * productos pertenecen a la misma transacción.
         * Si falla, Spring revierte todos los cambios.
         */
        Boleta guardada = boletaRepository.save(boleta);

        return BoletaResponse.from(guardada);
    }

    private BigDecimal multiplicadorCupon(
            String cupon
    ) {
        String codigo = cupon == null
                ? ""
                : cupon.trim().toUpperCase(Locale.ROOT);

        return switch (codigo) {
            case "" -> BigDecimal.ONE;

            case "AQUA10" ->
                    new BigDecimal("0.90");

            case "VERANO20" ->
                    new BigDecimal("0.80");

            default -> throw new BusinessException(
                    "El cupón ingresado no es válido",
                    HttpStatus.BAD_REQUEST
            );
        };
    }

    @Transactional(readOnly = true)
    public List<BoletaResponse> listar() {
        return boletaRepository
                .findAllByOrderByFechaDesc()
                .stream()
                .map(BoletaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public BoletaResponse obtener(Long id) {
        return BoletaResponse.from(buscar(id));
    }

    @Transactional(readOnly = true)
    public List<BoletaResponse> listarPorCorreo(
            String correo
    ) {
        Usuario usuario = usuarioRepository
                .findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario no encontrado"
                ));

        return boletaRepository
                .findByUsuarioIdOrderByFechaDesc(usuario.getId())
                .stream()
                .map(BoletaResponse::from)
                .toList();
    }

    @Transactional
    public BoletaResponse cambiarEstado(
            Long id,
            String estado
    ) {
        if (!ESTADOS.contains(estado)) {
            throw new BusinessException(
                    "Estado no válido. Use: " + ESTADOS,
                    HttpStatus.BAD_REQUEST
            );
        }

        /*
         * Bloqueamos la boleta antes de revisar
         * el estado para evitar cancelaciones
         * simultáneas.
         */
        Boleta boleta = boletaRepository
                .buscarParaCambiarEstado(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Boleta no encontrada: " + id
                ));

        String estadoActual = boleta.getEstado();

        // Repetir el mismo estado no modifica el stock.
        if (estadoActual.equals(estado)) {
            return BoletaResponse.from(boleta);
        }

        /*
         * Una boleta cancelada es definitiva.
         * No permitimos reactivarla y descontar
         * inventario de forma inconsistente.
         */
        if ("Cancelado".equals(estadoActual)) {
            throw new BusinessException(
                    "Una boleta cancelada no puede reactivarse",
                    HttpStatus.CONFLICT
            );
        }

        /*
         * Una boleta entregada ya completó
         * el flujo de compra.
         */
        if ("Entregado".equals(estadoActual)) {
            throw new BusinessException(
                    "Una boleta entregada no puede cambiar de estado",
                    HttpStatus.CONFLICT
            );
        }

        if ("Cancelado".equals(estado)) {
            reponerStock(boleta);
        }

        boleta.setEstado(estado);

        return BoletaResponse.from(
                boletaRepository.save(boleta)
        );
    }

    private void reponerStock(Boleta boleta) {

        /*
         * Mismo orden de bloqueo utilizado
         * al crear compras.
         */
        List<DetalleBoleta> detallesOrdenados =
                boleta.getDetalles()
                        .stream()
                        .sorted(Comparator.comparing(
                                detalle ->
                                        detalle.getProducto().getId()
                        ))
                        .toList();

        for (DetalleBoleta detalle : detallesOrdenados) {

            String productoId =
                    detalle.getProducto().getId();

            Producto producto = productoRepository
                    .buscarParaActualizarStock(productoId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "No se puede reponer stock. Producto no encontrado: "
                                    + productoId
                    ));

            long nuevoStock =
                    (long) producto.getStock() +
                    detalle.getCantidad();

            if (nuevoStock > Integer.MAX_VALUE) {
                throw new BusinessException(
                        "No se puede reponer el stock de " +
                        producto.getNombre(),
                        HttpStatus.CONFLICT
                );
            }

            producto.setStock((int) nuevoStock);
        }
    }

    private Boleta buscar(Long id) {
        return boletaRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Boleta no encontrada: " + id
                ));
    }
}