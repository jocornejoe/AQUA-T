package com.aquat.api.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;


public record UsuarioRequest(
        @NotBlank(message = "El RUN es obligatorio")
        @Size(max = 9, message = "El RUN admite hasta 9 caracteres")
        String run,

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 50, message = "El nombre admite hasta 50 caracteres")
        String nombre,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 100, message = "Los apellidos admiten hasta 100 caracteres")
        String apellidos,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no es válido")
        @Size(max = 100, message = "El correo admite hasta 100 caracteres")
        String correo,

        @Size(min = 6, max = 20, message = "La contraseña debe tener entre 6 y 20 caracteres")
        String contrasena,

        @Size(max = 20, message = "El teléfono admite hasta 20 caracteres")
        String telefono,

        LocalDate fechaNacimiento,

        @NotBlank(message = "El tipo de usuario es obligatorio")
        String tipoUsuario,

        @Size(max = 100) String region,
        @Size(max = 100) String comuna,
        @Size(max = 300) String direccion) {
}
