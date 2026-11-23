package com.aquat.api.dto;

import com.aquat.api.model.Producto;
import java.math.BigDecimal;

public record ProductoResponse(
        String id,
        String codigo,
        String nombre,
        String descripcion,
        BigDecimal precio,
        BigDecimal precioAnterior,
        String descuento,
        Integer stock,
        Integer stockCritico,
        String imagen,
        String categoria) {

    public static ProductoResponse from(Producto p) {
        return new ProductoResponse(
                p.getId(), p.getCodigo(), p.getNombre(), p.getDescripcion(), p.getPrecio(),
                p.getPrecioAnterior(), p.getDescuento(), p.getStock(), p.getStockCritico(),
                p.getImagen(), p.getCategoria().getNombre());
    }
}
