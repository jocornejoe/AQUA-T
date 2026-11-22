package com.aquat.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.aquat.api.dto.AuthResponse;
import com.aquat.api.dto.LoginRequest;
import com.aquat.api.model.Rol;
import com.aquat.api.model.Usuario;
import com.aquat.api.repository.UsuarioRepository;
import com.aquat.api.security.JwtService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private UsuarioService usuarioService;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder();
    private AuthService authService;
    private Usuario usuario;

    @BeforeEach
    void preparar() {
        JwtService jwt = new JwtService("clave-de-prueba-con-mas-de-treinta-y-dos-caracteres-123", 60);
        authService = new AuthService(usuarioRepository, encoder, jwt, usuarioService);

        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("Ana");
        usuario.setCorreo("ana@gmail.com");
        usuario.setRol(Rol.CLIENTE);
        usuario.setContrasenaHash(encoder.encode("secreto123"));
    }

    @Test
    void loginCorrectoDevuelveTokenYUsuario() {
        when(usuarioRepository.findByCorreoIgnoreCase("ana@gmail.com")).thenReturn(Optional.of(usuario));

        AuthResponse respuesta = authService.login(new LoginRequest("ana@gmail.com", "secreto123"));

        assertNotNull(respuesta.token());
        assertEquals("Cliente", respuesta.usuario().tipoUsuario());
    }

    @Test
    void loginConContrasenaIncorrectaFalla() {
        when(usuarioRepository.findByCorreoIgnoreCase("ana@gmail.com")).thenReturn(Optional.of(usuario));

        assertThrows(BadCredentialsException.class,
                () -> authService.login(new LoginRequest("ana@gmail.com", "otra-clave")));
    }

    @Test
    void loginConCorreoInexistenteFalla() {
        when(usuarioRepository.findByCorreoIgnoreCase("nadie@gmail.com")).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class,
                () -> authService.login(new LoginRequest("nadie@gmail.com", "secreto123")));
    }
}
