package com.aquat.api.dto;

import com.aquat.api.model.Boleta;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BoletaResponse(
        Long id,
        Long usuarioId,
        String clienteNombre,
        String clienteCorreo,
        String clienteTelefono,
        String envioRegion,
        String envioComuna,
        String envioDireccion,
        BigDecimal subtotal,
        BigDecimal total,
        String estado,
        LocalDateTime fecha,
        List<DetalleResponse> detalles) {

    public static BoletaResponse from(Boleta b) {
        return new BoletaResponse(
                b.getId(),
                b.getUsuario() != null ? b.getUsuario().getId() : null,
                b.getClienteNombre(), b.getClienteCorreo(), b.getClienteTelefono(),
                b.getEnvioRegion(), b.getEnvioComuna(), b.getEnvioDireccion(),
                b.getSubtotal(), b.getTotal(), b.getEstado(), b.getFecha(),
                b.getDetalles().stream().map(DetalleResponse::from).toList());
    }
}
