package com.aquat.api.service;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import com.aquat.api.exception.BusinessException;

@Service
public class GoogleTokenService {

    public record Identidad(String sub, String correo) {
    }

    private final NimbusJwtDecoder decoder;
    private final String clientId;

    public GoogleTokenService(
            @Value("${GOOGLE_CLIENT_ID:}") String clientId
    ) {
        this.clientId = clientId.trim();

        this.decoder = NimbusJwtDecoder
                .withJwkSetUri(
                        "https://www.googleapis.com/oauth2/v3/certs"
                )
                .build();
    }

    public Identidad verificar(String credential) {

        if (clientId.isBlank()) {
            throw new BusinessException(
                    "El inicio de sesión con Google no está configurado",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }

        if (credential == null || credential.isBlank()) {
            throw new BadCredentialsException(
                    "Falta la credencial de Google"
            );
        }

        try {
            Jwt jwt = decoder.decode(credential);

            String issuer = jwt.getIssuer() == null
                    ? ""
                    : jwt.getIssuer().toString();

            if (!Set.of(
                    "https://accounts.google.com",
                    "accounts.google.com"
            ).contains(issuer)) {
                throw new BadCredentialsException(
                        "Emisor de Google no válido"
                );
            }

            if (!jwt.getAudience().contains(clientId)) {
                throw new BadCredentialsException(
                        "La credencial no pertenece a AQUA-T"
                );
            }

            if (jwt.getExpiresAt() == null ||
                    !jwt.getExpiresAt().isAfter(Instant.now())) {
                throw new BadCredentialsException(
                        "La credencial de Google expiró"
                );
            }

            Object verificado = jwt.getClaim("email_verified");

            boolean correoVerificado =
                    Boolean.TRUE.equals(verificado) ||
                    "true".equalsIgnoreCase(
                            String.valueOf(verificado)
                    );

            String correo = jwt.getClaimAsString("email");
            String sub = jwt.getSubject();

            if (!correoVerificado ||
                    correo == null || correo.isBlank() ||
                    sub == null || sub.isBlank()) {
                throw new BadCredentialsException(
                        "Google no entregó una identidad verificada"
                );
            }

            correo = correo.trim().toLowerCase(Locale.ROOT);

            int posicionArroba = correo.lastIndexOf('@');

            if (posicionArroba < 1) {
                throw new BadCredentialsException(
                        "Correo de Google no válido"
                );
            }

            String dominio = correo.substring(posicionArroba + 1);

            if (!Set.of(
                    "gmail.com",
                    "duoc.cl",
                    "profesor.duoc.cl"
            ).contains(dominio)) {
                throw new BadCredentialsException(
                        "El dominio de correo no está permitido"
                );
            }

            String dominioAlojado = jwt.getClaimAsString("hd");

            // Gmail está administrado por Google.
            // Para otros dominios exigimos que Google
            // Workspace confirme el dominio correspondiente.
            if (!dominio.equals("gmail.com") &&
                    (dominioAlojado == null ||
                    !dominioAlojado.equalsIgnoreCase(dominio))) {
                throw new BadCredentialsException(
                        "Esta cuenta institucional requiere inicio de sesión tradicional"
                );
            }

            return new Identidad(sub, correo);

        } catch (JwtException | IllegalArgumentException ex) {
            throw new BadCredentialsException(
                    "No se pudo verificar la credencial de Google"
            );
        }
    }

    // Conservamos compatibilidad con otras llamadas existentes.
    public String verificarCorreo(String credential) {
        return verificar(credential).correo();
    }
}