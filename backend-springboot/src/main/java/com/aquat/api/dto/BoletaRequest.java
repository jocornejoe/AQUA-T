package com.aquat.api.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record BoletaRequest(

        @NotBlank(message = "El nombre del cliente es obligatorio")
        @Size(max = 150)
        String clienteNombre,

        @NotBlank(message = "El correo del cliente es obligatorio")
        @Email(message = "El correo no es válido")
        @Size(max = 100)
        String clienteCorreo,

        @Size(max = 20)
        String clienteTelefono,

        @NotBlank(message = "La región de envío es obligatoria")
        String envioRegion,

        @NotBlank(message = "La comuna de envío es obligatoria")
        String envioComuna,

        @NotBlank(message = "La dirección de envío es obligatoria")
        @Size(max = 300)
        String envioDireccion,

        @NotEmpty(message = "La compra debe incluir al menos un producto")
        @Valid
        List<ItemRequest> items,

        @Size(max = 20)
        String cupon
) {

    public BoletaRequest(
            String clienteNombre,
            String clienteCorreo,
            String clienteTelefono,
            String envioRegion,
            String envioComuna,
            String envioDireccion,
            List<ItemRequest> items
    ) {
        this(
                clienteNombre,
                clienteCorreo,
                clienteTelefono,
                envioRegion,
                envioComuna,
                envioDireccion,
                items,
                null
        );
    }
}