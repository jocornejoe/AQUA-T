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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final String MENSAJE_CREDENCIALES = "Correo o contraseña incorrectos";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UsuarioService usuarioService;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, UsuarioService usuarioService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.usuarioService = usuarioService;
    }

    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(request.correo().trim())
                .orElseThrow(() -> new BadCredentialsException(MENSAJE_CREDENCIALES));

        if (!passwordEncoder.matches(request.contrasena(), usuario.getContrasenaHash())) {
            throw new BadCredentialsException(MENSAJE_CREDENCIALES);
        }

        return new AuthResponse(jwtService.generar(usuario), UsuarioResponse.from(usuario));
    }

    /** El registro público siempre crea usuarios con rol CLIENTE. */
    public UsuarioResponse registrar(RegistroRequest r) {
        UsuarioRequest request = new UsuarioRequest(
                r.run(), r.nombre(), r.apellidos(), r.correo(), r.contrasena(),
                r.telefono(), r.fechaNacimiento(), Rol.CLIENTE.name(),
                r.region(), r.comuna(), r.direccion());
        return usuarioService.crear(request);
    }
}
