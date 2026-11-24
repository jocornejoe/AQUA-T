package com.aquat.api.security;

import com.aquat.api.model.Rol;
import com.aquat.api.model.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String SECRETO =
            "clave-de-prueba-con-mas-de-treinta-y-dos-caracteres-123";

    private Usuario usuario() {
        Usuario u = new Usuario();
        u.setId(7L);
        u.setCorreo("admin@duoc.cl");
        u.setRol(Rol.ADMINISTRADOR);
        return u;
    }

    private String firmarToken(
            long inicioSesion,
            long vencimiento
    ) {
        long ahora = System.currentTimeMillis();

        return Jwts.builder()
                .subject("admin@duoc.cl")
                .claim("rol", "ADMINISTRADOR")
                .claim("uid", 7L)
                .claim("inicioSesion", inicioSesion)
                .issuedAt(new Date(ahora - 1_000L))
                .expiration(new Date(vencimiento))
                .signWith(
                        Keys.hmacShaKeyFor(
                                SECRETO.getBytes(
                                        StandardCharsets.UTF_8
                                )
                        )
                )
                .compact();
    }

    @Test
    void generaUnTokenConCorreoRolEIdentificador() {
        JwtService jwt = new JwtService(SECRETO, 60);

        Claims claims = jwt.leer(
                jwt.generar(usuario())
        );

        assertEquals(
                "admin@duoc.cl",
                claims.getSubject()
        );

        assertEquals(
                "ADMINISTRADOR",
                claims.get("rol", String.class)
        );

        assertEquals(
                7L,
                ((Number) claims.get("uid")).longValue()
        );

        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiration());
    }

    @Test
    void rechazaUnTokenInvalido() {
        JwtService jwt = new JwtService(SECRETO, 60);

        assertThrows(
                JwtException.class,
                () -> jwt.leer("esto.no.es-un-token")
        );
    }

    @Test
    void rechazaUnTokenVencido() {
        JwtService jwt = new JwtService(SECRETO, 60);

        long ahora = System.currentTimeMillis();

        String vencido = firmarToken(
                ahora - 120_000L,
                ahora - 60_000L
        );

        assertThrows(
                ExpiredJwtException.class,
                () -> jwt.leer(vencido)
        );
    }

    @Test
    void rechazaUnTokenFirmadoConOtraClave() {
        JwtService emisor = new JwtService(
                "otra-clave-distinta-con-mas-de-treinta-y-dos-caracteres",
                60
        );

        JwtService validador = new JwtService(
                SECRETO,
                60
        );

        assertThrows(
                JwtException.class,
                () -> validador.leer(
                        emisor.generar(usuario())
                )
        );
    }

    @Test
    void rechazaDuracionesNoPositivas() {
        assertThrows(
                IllegalArgumentException.class,
                () -> new JwtService(SECRETO, 0)
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> new JwtService(SECRETO, -1)
        );
    }

    @Test
    void renovarConservaElInicioOriginalDeSesion() {
        JwtService jwt = new JwtService(SECRETO, 120);

        String original = jwt.generar(usuario());
        Claims claimsOriginal = jwt.leer(original);

        String renovado = jwt.renovar(
                usuario(),
                claimsOriginal
        );

        Claims claimsRenovados = jwt.leer(renovado);

        assertEquals(
                claimsOriginal.get("inicioSesion"),
                claimsRenovados.get("inicioSesion")
        );

        assertEquals(
                "admin@duoc.cl",
                claimsRenovados.getSubject()
        );
    }

    @Test
    void rechazaRenovarUnaSesionDeMasDeOchoHoras() {
        JwtService jwt = new JwtService(SECRETO, 120);

        long ahora = System.currentTimeMillis();
        long nueveHoras = 9L * 60 * 60 * 1000;

        String token = firmarToken(
                ahora - nueveHoras,
                ahora + 60_000L
        );

        Claims claims = jwt.leer(token);

        assertThrows(
                BadCredentialsException.class,
                () -> jwt.renovar(usuario(), claims)
        );
    }

    @Test
    void renovacionRespetaElLimiteDeOchoHoras() {
        JwtService jwt = new JwtService(SECRETO, 120);

        long ahora = System.currentTimeMillis();
        long ochoHoras = 8L * 60 * 60 * 1000;
        long inicio = ahora - ochoHoras + 5 * 60_000L;

        String token = firmarToken(
                inicio,
                ahora + 60_000L
        );

        String renovado = jwt.renovar(
                usuario(),
                jwt.leer(token)
        );

        Claims claims = jwt.leer(renovado);

        assertTrue(
                claims.getExpiration().getTime()
                        <= inicio + ochoHoras
        );

        assertTrue(
                claims.getExpiration().getTime()
                        > System.currentTimeMillis()
        );
    }
}