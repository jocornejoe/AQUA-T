package com.aquat.api.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;


public record BoletaRequest(
        @NotBlank(message = "El nombre del cliente es obligatorio")
        @Size(max = 150, message = "El nombre admite hasta 150 caracteres")
        String clienteNombre,

        @NotBlank(message = "El correo del cliente es obligatorio")
        @Email(message = "El correo no es válido")
        @Size(max = 100, message = "El correo admite hasta 100 caracteres")
        String clienteCorreo,

        @Size(max = 20, message = "El teléfono admite hasta 20 caracteres")
        String clienteTelefono,

        @NotBlank(message = "La región de envío es obligatoria")
        String envioRegion,

        @NotBlank(message = "La comuna de envío es obligatoria")
        String envioComuna,

        @NotBlank(message = "La dirección de envío es obligatoria")
        @Size(max = 300, message = "La dirección admite hasta 300 caracteres")
        String envioDireccion,

        @NotEmpty(message = "La compra debe incluir al menos un producto")
        @Valid
        List<ItemRequest> items) {
}
