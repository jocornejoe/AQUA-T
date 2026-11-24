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
import java.util.List;
import java.util.Locale;
import java.util.Set;

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
        // El cupón se valida antes de modificar el inventario.
        BigDecimal multiplicador = multiplicadorCupon(request.cupon());

        Usuario usuario = usuarioRepository
                .findByCorreoIgnoreCase(correoUsuario)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "El usuario de la sesión no existe"
                ));

        Boleta boleta = new Boleta();

        boleta.setUsuario(usuario);
        boleta.setClienteNombre(request.clienteNombre().trim());
        boleta.setClienteCorreo(request.clienteCorreo().trim());
        boleta.setClienteTelefono(request.clienteTelefono());
        boleta.setEnvioRegion(request.envioRegion());
        boleta.setEnvioComuna(request.envioComuna());
        boleta.setEnvioDireccion(request.envioDireccion());

        BigDecimal subtotal = BigDecimal.ZERO;

        for (ItemRequest item : request.items()) {

            Producto producto = productoRepository
                    .findById(item.productoId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Producto no encontrado: " + item.productoId()
                    ));

            if (producto.getStock() < item.cantidad()) {
                throw new BusinessException(
                        "Stock insuficiente para " + producto.getNombre()
                                + " (disponible: " + producto.getStock() + ")",
                        HttpStatus.CONFLICT
                );
            }

            producto.setStock(
                    producto.getStock() - item.cantidad()
            );

            DetalleBoleta detalle = new DetalleBoleta();
            detalle.setProducto(producto);
            detalle.setCantidad(item.cantidad());
            detalle.setPrecioUnitario(producto.getPrecio());

            boleta.agregarDetalle(detalle);

            subtotal = subtotal.add(
                    producto.getPrecio().multiply(
                            BigDecimal.valueOf(item.cantidad())
                    )
            );
        }

        BigDecimal total = subtotal
                .multiply(multiplicador)
                .setScale(2, RoundingMode.HALF_UP);

        boleta.setSubtotal(subtotal);
        boleta.setTotal(total);

        return BoletaResponse.from(
                boletaRepository.save(boleta)
        );
    }

    private BigDecimal multiplicadorCupon(String cupon) {
        String codigo = cupon == null
                ? ""
                : cupon.trim().toUpperCase(Locale.ROOT);

        return switch (codigo) {
            case "" -> BigDecimal.ONE;
            case "AQUA10" -> new BigDecimal("0.90");
            case "VERANO20" -> new BigDecimal("0.80");
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
    public List<BoletaResponse> listarPorCorreo(String correo) {
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
    public BoletaResponse cambiarEstado(Long id, String estado) {
        if (!ESTADOS.contains(estado)) {
            throw new BusinessException(
                    "Estado no válido. Use: " + ESTADOS,
                    HttpStatus.BAD_REQUEST
            );
        }

        Boleta boleta = buscar(id);
        boleta.setEstado(estado);

        return BoletaResponse.from(
                boletaRepository.save(boleta)
        );
    }

    private Boleta buscar(Long id) {
        return boletaRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Boleta no encontrada: " + id
                ));
    }
}