package com.aquat.api.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.aquat.api.model.Rol;
import com.aquat.api.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRETO = "clave-de-prueba-con-mas-de-treinta-y-dos-caracteres-123";

    private Usuario usuario() {
        Usuario u = new Usuario();
        u.setId(7L);
        u.setCorreo("admin@duoc.cl");
        u.setRol(Rol.ADMINISTRADOR);
        return u;
    }

    @Test
    void generaUnTokenConCorreoYRol() {
        JwtService jwt = new JwtService(SECRETO, 60);

        Claims claims = jwt.leer(jwt.generar(usuario()));

        assertEquals("admin@duoc.cl", claims.getSubject());
        assertEquals("ADMINISTRADOR", claims.get("rol", String.class));
    }

    @Test
    void rechazaUnTokenInvalido() {
        JwtService jwt = new JwtService(SECRETO, 60);

        assertThrows(JwtException.class, () -> jwt.leer("esto.no.es-un-token"));
    }

    @Test
    void rechazaUnTokenVencido() {
        JwtService jwt = new JwtService(SECRETO, -1);

        String vencido = jwt.generar(usuario());

        assertThrows(JwtException.class, () -> jwt.leer(vencido));
    }

    @Test
    void rechazaUnTokenFirmadoConOtraClave() {
        JwtService emisor = new JwtService("otra-clave-distinta-con-mas-de-treinta-y-dos-caracteres", 60);
        JwtService validador = new JwtService(SECRETO, 60);

        assertThrows(JwtException.class, () -> validador.leer(emisor.generar(usuario())));
    }
}
