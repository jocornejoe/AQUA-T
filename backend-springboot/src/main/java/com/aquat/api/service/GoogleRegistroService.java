package com.aquat.api.service;

import com.aquat.api.dto.AuthResponse;
import com.aquat.api.dto.GoogleRegistroRequest;
import com.aquat.api.dto.UsuarioResponse;
import com.aquat.api.exception.BusinessException;
import com.aquat.api.model.Rol;
import com.aquat.api.model.Usuario;
import com.aquat.api.repository.UsuarioRepository;
import com.aquat.api.security.JwtService;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.Base64;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoogleRegistroService {

    private static final SecureRandom ALEATORIO = new SecureRandom();

    private final GoogleTokenService googleTokenService;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public GoogleRegistroService(
            GoogleTokenService googleTokenService,
            UsuarioRepository usuarioRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder
    ) {
        this.googleTokenService = googleTokenService;
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse registrar(GoogleRegistroRequest request) {

        GoogleTokenService.Identidad identidad =
                googleTokenService.verificar(request.credential());

        if (usuarioRepository.findByGoogleSub(
                identidad.sub()).isPresent()) {
            throw new BusinessException(
                    "Esta cuenta de Google ya está registrada",
                    HttpStatus.CONFLICT
            );
        }

        if (usuarioRepository.existsByCorreoIgnoreCase(
                identidad.correo())) {
            throw new BusinessException(
                    "Este correo ya existe en AQUA-T. Inicia sesión.",
                    HttpStatus.CONFLICT
            );
        }

        String run = validarYNormalizarRun(request.run());

        if (usuarioRepository.existsByRun(run)) {
            throw new BusinessException(
                    "Este RUN ya está registrado",
                    HttpStatus.CONFLICT
            );
        }

        if (request.fechaNacimiento() != null &&
                request.fechaNacimiento().isAfter(LocalDate.now())) {
            throw new BusinessException(
                    "La fecha de nacimiento no puede ser futura",
                    HttpStatus.BAD_REQUEST
            );
        }

        Usuario usuario = new Usuario();

        usuario.setGoogleSub(identidad.sub());
        usuario.setCorreo(identidad.correo());

        usuario.setRun(run);
        usuario.setNombre(request.nombre().trim());
        usuario.setApellidos(request.apellidos().trim());

        usuario.setTelefono(request.telefono());
        usuario.setFechaNacimiento(request.fechaNacimiento());

        usuario.setRegion(request.region().trim());
        usuario.setComuna(request.comuna().trim());
        usuario.setDireccion(request.direccion().trim());

        // El registro público siempre crea una cuenta Cliente.
        usuario.setRol(Rol.CLIENTE);

        // Se guarda un hash aleatorio. No se asigna
        // una contraseña conocida a la cuenta Google.
        byte[] bytes = new byte[32];
        ALEATORIO.nextBytes(bytes);

        String valorAleatorio = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);

        usuario.setContrasenaHash(
                passwordEncoder.encode(valorAleatorio)
        );

        Usuario guardado = usuarioRepository.save(usuario);

        return new AuthResponse(
                jwtService.generar(guardado),
                UsuarioResponse.from(guardado)
        );
    }

    private String validarYNormalizarRun(String entrada) {

        String run = entrada
                .replaceAll("[.\\s-]", "")
                .toUpperCase(Locale.ROOT);

        if (!run.matches("\\d{6,8}[0-9K]")) {
            throw new BusinessException(
                    "RUN inválido: ingresa número y dígito verificador",
                    HttpStatus.BAD_REQUEST
            );
        }

        String numero = run.substring(0, run.length() - 1);
        String dv = run.substring(run.length() - 1);

        int suma = 0;
        int factor = 2;

        for (int i = numero.length() - 1; i >= 0; i--) {
            suma += Character.digit(numero.charAt(i), 10) * factor;
            factor = factor == 7 ? 2 : factor + 1;
        }

        int resultado = 11 - (suma % 11);

        String esperado = resultado == 11
                ? "0"
                : resultado == 10
                    ? "K"
                    : String.valueOf(resultado);

        if (!dv.equals(esperado)) {
            throw new BusinessException(
                    "El dígito verificador del RUN es incorrecto",
                    HttpStatus.BAD_REQUEST
            );
        }

        return run;
    }
}