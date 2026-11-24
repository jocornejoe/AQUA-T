package com.aquat.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleLoginRequest(
        @NotBlank(message = "La credencial de Google es obligatoria")
        @Size(max = 8192)
        String credential
) {
}