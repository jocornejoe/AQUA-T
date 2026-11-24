package com.aquat.api.controller;

import com.aquat.api.dto.AuthResponse;
import com.aquat.api.dto.GoogleLoginRequest;
import com.aquat.api.dto.GoogleRegistroRequest;
import com.aquat.api.dto.UsuarioResponse;
import com.aquat.api.exception.BusinessException;
import com.aquat.api.model.Rol;
import com.aquat.api.model.Usuario;
import com.aquat.api.repository.UsuarioRepository;
import com.aquat.api.security.JwtService;
import com.aquat.api.service.GoogleRegistroService;
import com.aquat.api.service.GoogleTokenService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/google")
@Tag(name = "Autenticación Google")
public class GoogleAuthController {

    private final GoogleTokenService googleTokenService;
    private final GoogleRegistroService googleRegistroService;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    public GoogleAuthController(
            GoogleTokenService googleTokenService,
            GoogleRegistroService googleRegistroService,
            UsuarioRepository usuarioRepository,
            JwtService jwtService
    ) {
        this.googleTokenService = googleTokenService;
        this.googleRegistroService = googleRegistroService;
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
    }

    @PostMapping
    @Operation(summary = "Iniciar sesión con Google")
    public AuthResponse iniciarSesion(
            @Valid @RequestBody GoogleLoginRequest request
    ) {
        GoogleTokenService.Identidad identidad =
                googleTokenService.verificar(request.credential());

        // Primero buscamos por el identificador único de Google.
        Usuario usuario = usuarioRepository
                .findByGoogleSub(identidad.sub())
                .orElse(null);

        if (usuario == null) {
            usuario = usuarioRepository
                    .findByCorreoIgnoreCase(identidad.correo())
                    .orElseThrow(() -> new BusinessException(
                            "Esta cuenta de Google no está registrada en AQUA-T. Regístrate primero.",
                            HttpStatus.BAD_REQUEST
                    ));

            if (usuario.getGoogleSub() != null) {
                throw new BusinessException(
                        "Esta cuenta está vinculada a otra identidad de Google",
                        HttpStatus.FORBIDDEN
                );
            }

            // Solo permitimos vincular automáticamente
            // cuentas Cliente. Las cuentas administrativas
            // requieren un procedimiento independiente.
            if (usuario.getRol() != Rol.CLIENTE) {
                throw new BusinessException(
                        "Para esta cuenta utiliza el inicio de sesión tradicional",
                        HttpStatus.FORBIDDEN
                );
            }

            usuario.setGoogleSub(identidad.sub());
            usuarioRepository.save(usuario);
        }

        return new AuthResponse(
                jwtService.generar(usuario),
                UsuarioResponse.from(usuario)
        );
    }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registrar una cuenta Cliente con Google")
    public AuthResponse registrar(
            @Valid @RequestBody GoogleRegistroRequest request
    ) {
        return googleRegistroService.registrar(request);
    }
}