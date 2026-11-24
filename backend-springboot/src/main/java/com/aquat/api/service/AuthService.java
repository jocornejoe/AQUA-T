package com.aquat.api.service;

import com.aquat.api.dto.AuthResponse;
import com.aquat.api.dto.LoginRequest;
import com.aquat.api.dto.RegistroRequest;
import com.aquat.api.dto.UsuarioRequest;
import com.aquat.api.dto.UsuarioResponse;

import com.aquat.api.model.Rol;
import com.aquat.api.model.Usuario;

import com.aquat.api.repository.UsuarioRepository;
import com.aquat.api.security.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final String MENSAJE_CREDENCIALES =
            "Correo o contraseña incorrectos";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UsuarioService usuarioService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UsuarioService usuarioService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.usuarioService = usuarioService;
    }

    public AuthResponse login(LoginRequest request) {

        Usuario usuario = usuarioRepository
                .findByCorreoIgnoreCase(
                        request.correo().trim()
                )
                .orElseThrow(() ->
                        new BadCredentialsException(
                                MENSAJE_CREDENCIALES
                        )
                );

        if (!passwordEncoder.matches(
                request.contrasena(),
                usuario.getContrasenaHash()
        )) {
            throw new BadCredentialsException(
                    MENSAJE_CREDENCIALES
            );
        }

        return new AuthResponse(
                jwtService.generar(usuario),
                UsuarioResponse.from(usuario)
        );
    }

    public AuthResponse renovar(String token) {

        Claims claims;

        try {
            claims = jwtService.leer(token);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new BadCredentialsException(
                    "El token no es válido o ha expirado"
            );
        }

        Usuario usuario = usuarioRepository
                .findByCorreoIgnoreCase(claims.getSubject())
                .orElseThrow(() ->
                        new BadCredentialsException(
                                "El usuario de la sesión ya no existe"
                        )
                );

        Object identificador = claims.get("uid");

        if (identificador == null ||
                !String.valueOf(usuario.getId())
                        .equals(String.valueOf(identificador))) {
            throw new BadCredentialsException(
                    "La identidad del token no coincide con la cuenta"
            );
        }

        return new AuthResponse(
                jwtService.renovar(usuario, claims),
                UsuarioResponse.from(usuario)
        );
    }

    public UsuarioResponse registrar(RegistroRequest r) {

        UsuarioRequest request = new UsuarioRequest(
                r.run(),
                r.nombre(),
                r.apellidos(),
                r.correo(),
                r.contrasena(),
                r.telefono(),
                r.fechaNacimiento(),
                Rol.CLIENTE.name(),
                r.region(),
                r.comuna(),
                r.direccion()
        );

        return usuarioService.crear(request);
    }
}