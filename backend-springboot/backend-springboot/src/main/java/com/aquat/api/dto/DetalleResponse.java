package com.aquat.api.dto;

import com.aquat.api.model.DetalleBoleta;
import java.math.BigDecimal;

public record DetalleResponse(
        Long id,
        String productoId,
        String productoNombre,
        Integer cantidad,
        BigDecimal precioUnitario,
        BigDecimal subtotal) {

    public static DetalleResponse from(DetalleBoleta d) {
        return new DetalleResponse(
                d.getId(),
                d.getProducto().getId(),
                d.getProducto().getNombre(),
                d.getCantidad(),
                d.getPrecioUnitario(),
                d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad())));
    }
}
