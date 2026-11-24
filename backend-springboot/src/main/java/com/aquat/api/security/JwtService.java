package com.aquat.api.security;

import com.aquat.api.model.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final long MAX_SESION_MS =
            8L * 60 * 60 * 1000;

    private final SecretKey clave;
    private final long expiracionMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secreto,
            @Value("${app.jwt.expiration-minutes}") long minutos
    ) {
        if (minutos <= 0) {
            throw new IllegalArgumentException(
                    "La duración del JWT debe ser positiva"
            );
        }

        this.clave = Keys.hmacShaKeyFor(
                secreto.getBytes(StandardCharsets.UTF_8)
        );

        this.expiracionMs = minutos * 60_000L;
    }

    public String generar(Usuario usuario) {
        long ahora = System.currentTimeMillis();
        return emitir(usuario, ahora);
    }

    public String renovar(
            Usuario usuario,
            Claims tokenAnterior
    ) {
        Object valorInicio = tokenAnterior.get("inicioSesion");

        long inicioSesion;

        if (valorInicio instanceof Number numero) {
            inicioSesion = numero.longValue();
        } else if (tokenAnterior.getIssuedAt() != null) {
            // Compatibilidad con los JWT anteriores.
            inicioSesion =
                    tokenAnterior.getIssuedAt().getTime();
        } else {
            throw new BadCredentialsException(
                    "El token no contiene una fecha de inicio válida"
            );
        }

        long ahora = System.currentTimeMillis();

        if (inicioSesion <= 0 ||
                inicioSesion > ahora ||
                ahora - inicioSesion >= MAX_SESION_MS) {
            throw new BadCredentialsException(
                    "Se alcanzó el tiempo máximo de sesión. Inicia sesión nuevamente."
            );
        }

        return emitir(usuario, inicioSesion);
    }

    private String emitir(
            Usuario usuario,
            long inicioSesion
    ) {
        long ahora = System.currentTimeMillis();

        long expiracion = Math.min(
                ahora + expiracionMs,
                inicioSesion + MAX_SESION_MS
        );

        if (expiracion <= ahora) {
            throw new BadCredentialsException(
                    "La sesión ha expirado"
            );
        }

        return Jwts.builder()
                .subject(usuario.getCorreo())
                .claim("rol", usuario.getRol().name())
                .claim("uid", usuario.getId())
                .claim("inicioSesion", inicioSesion)
                .issuedAt(new Date(ahora))
                .expiration(new Date(expiracion))
                .signWith(clave)
                .compact();
    }

    public Claims leer(String token) {
        return Jwts.parser()
                .verifyWith(clave)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}