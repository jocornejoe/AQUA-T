package com.aquat.api.controller;

import com.aquat.api.dto.AuthResponse;
import com.aquat.api.dto.GoogleLoginRequest;
import com.aquat.api.dto.UsuarioResponse;
import com.aquat.api.exception.BusinessException;
import com.aquat.api.model.Usuario;
import com.aquat.api.repository.UsuarioRepository;
import com.aquat.api.security.JwtService;
import com.aquat.api.service.GoogleTokenService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticación Google")
public class GoogleAuthController {

    private final GoogleTokenService googleTokenService;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    public GoogleAuthController(
            GoogleTokenService googleTokenService,
            UsuarioRepository usuarioRepository,
            JwtService jwtService
    ) {
        this.googleTokenService = googleTokenService;
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/google")
    @Operation(
            summary = "Iniciar sesión con Google",
            description = "Verifica el token de Google y genera un JWT de AQUA-T para una cuenta registrada"
    )
    public AuthResponse iniciarConGoogle(
            @Valid @RequestBody GoogleLoginRequest request
    ) {
        String correo = googleTokenService.verificarCorreo(
                request.credential()
        );

        Usuario usuario = usuarioRepository
                .findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new BusinessException(
                        "Esta cuenta de Google no está registrada en AQUA-T. Regístrate primero.",
                        HttpStatus.BAD_REQUEST
                ));

        return new AuthResponse(
                jwtService.generar(usuario),
                UsuarioResponse.from(usuario)
        );
    }
}