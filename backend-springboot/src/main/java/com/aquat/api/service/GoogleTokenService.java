package com.aquat.api.service;

import java.time.Instant;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import com.aquat.api.exception.BusinessException;

@Service
public class GoogleTokenService {

    private final JwtDecoder decoder;
    private final String clientId;

    public GoogleTokenService(
            @Value("${GOOGLE_CLIENT_ID:}") String clientId
    ) {
        this.clientId = clientId.trim();

        this.decoder = NimbusJwtDecoder
                .withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .build();
    }

    public String verificarCorreo(String credential) {

        if (clientId.isBlank()) {
            throw new BusinessException(
                    "El inicio de sesión con Google no está configurado",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }

        if (credential == null || credential.isBlank()) {
            throw new BadCredentialsException(
                    "La credencial de Google está vacía"
            );
        }

        try {
            Jwt jwt = decoder.decode(credential);

            String issuer = jwt.getIssuer() == null
                    ? ""
                    : jwt.getIssuer().toString();

            boolean issuerValido =
                    issuer.equals("https://accounts.google.com") ||
                    issuer.equals("accounts.google.com");

            if (!issuerValido ||
                    !jwt.getAudience().contains(clientId) ||
                    jwt.getExpiresAt() == null ||
                    !jwt.getExpiresAt().isAfter(Instant.now())) {

                throw new BadCredentialsException(
                        "La credencial de Google no es válida"
                );
            }

            Object verificado = jwt.getClaim("email_verified");

            boolean correoVerificado =
                    Boolean.TRUE.equals(verificado) ||
                    "true".equalsIgnoreCase(String.valueOf(verificado));

            String correo = jwt.getClaimAsString("email");
            String dominioAlojado = jwt.getClaimAsString("hd");

            if (!correoVerificado || correo == null || correo.isBlank()) {
                throw new BadCredentialsException(
                        "Google no ha verificado este correo"
                );
            }

            correo = correo.trim().toLowerCase(Locale.ROOT);

            boolean googleAutoritativo =
                    correo.endsWith("@gmail.com") ||
                    (dominioAlojado != null && !dominioAlojado.isBlank());

            if (!googleAutoritativo) {
                throw new BadCredentialsException(
                        "Este correo requiere autenticación tradicional"
                );
            }

            return correo;

        } catch (JwtException | IllegalArgumentException ex) {
            throw new BadCredentialsException(
                    "No se pudo verificar la credencial de Google"
            );
        }
    }
}