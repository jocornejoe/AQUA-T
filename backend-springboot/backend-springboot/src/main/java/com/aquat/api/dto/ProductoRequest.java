package com.aquat.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductoRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre admite hasta 100 caracteres")
        String nombre,

        @Size(max = 500, message = "La descripción admite hasta 500 caracteres")
        String descripcion,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.0", message = "El precio no puede ser negativo")
        BigDecimal precio,

        @DecimalMin(value = "0.0", message = "El precio anterior no puede ser negativo")
        BigDecimal precioAnterior,

        @Size(max = 20, message = "El descuento admite hasta 20 caracteres")
        String descuento,

        @NotNull(message = "El stock es obligatorio")
        @Min(value = 0, message = "El stock no puede ser negativo")
        Integer stock,

        @Min(value = 0, message = "El stock crítico no puede ser negativo")
        Integer stockCritico,

        @NotBlank(message = "La categoría es obligatoria")
        String categoria,

        @Size(max = 255, message = "La ruta de imagen admite hasta 255 caracteres")
        String imagen) {
}
