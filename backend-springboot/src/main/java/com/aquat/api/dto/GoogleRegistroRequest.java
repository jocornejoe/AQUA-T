package com.aquat.api.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleRegistroRequest(

        @NotBlank
        @Size(max = 8192)
        String credential,

        @NotBlank
        @Size(max = 10)
        String run,

        @NotBlank
        @Size(max = 50)
        String nombre,

        @NotBlank
        @Size(max = 100)
        String apellidos,

        @Size(max = 20)
        String telefono,

        LocalDate fechaNacimiento,

        @NotBlank
        @Size(max = 100)
        String region,

        @NotBlank
        @Size(max = 100)
        String comuna,

        @NotBlank
        @Size(max = 300)
        String direccion
) {
}