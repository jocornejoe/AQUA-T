package com.aquat.api.controller;

import com.aquat.api.dto.AuthResponse;
import com.aquat.api.dto.LoginRequest;
import com.aquat.api.dto.RegistroRequest;
import com.aquat.api.dto.UsuarioResponse;

import com.aquat.api.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(
        name = "Autenticación",
        description = "Inicio de sesión, registro y renovación JWT"
)
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(
            summary = "Iniciar sesión",
            description = "Devuelve un JWT y los datos del usuario"
    )
    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return authService.login(request);
    }

    @Operation(
            summary = "Registrar cliente",
            description = "Crea una cuenta con rol Cliente"
    )
    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse registro(
            @Valid @RequestBody RegistroRequest request
    ) {
        return authService.registrar(request);
    }

    @Operation(
            summary = "Renovar JWT",
            description = "Requiere un JWT vigente. " +
                    "La renovación conserva el límite máximo de sesión."
    )
    @PostMapping("/renovar")
    public AuthResponse renovar(
            @RequestHeader(
                    value = "Authorization",
                    required = false
            ) String authorization
    ) {
        if (authorization == null ||
                !authorization.startsWith("Bearer ")) {
            throw new BadCredentialsException(
                    "Debes enviar un token Bearer válido"
            );
        }

        return authService.renovar(
                authorization.substring(7)
        );
    }
}