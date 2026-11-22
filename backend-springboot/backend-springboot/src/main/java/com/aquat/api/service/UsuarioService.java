package com.aquat.api.service;

import com.aquat.api.dto.UsuarioRequest;
import com.aquat.api.dto.UsuarioResponse;
import com.aquat.api.exception.BusinessException;
import com.aquat.api.exception.ResourceNotFoundException;
import com.aquat.api.model.Rol;
import com.aquat.api.model.Usuario;
import com.aquat.api.repository.UsuarioRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream().map(UsuarioResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {
        return UsuarioResponse.from(buscar(id));
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        if (request.contrasena() == null || request.contrasena().isBlank()) {
            throw new BusinessException("La contraseña es obligatoria", HttpStatus.BAD_REQUEST);
        }
        validarUnicos(request, null);

        Usuario usuario = new Usuario();
        aplicar(usuario, request);
        usuario.setContrasenaHash(passwordEncoder.encode(request.contrasena()));
        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioRequest request) {
        Usuario usuario = buscar(id);
        validarUnicos(request, id);
        aplicar(usuario, request);

        if (request.contrasena() != null && !request.contrasena().isBlank()) {
            usuario.setContrasenaHash(passwordEncoder.encode(request.contrasena()));
        }
        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    @Transactional
    public void eliminar(Long id) {
        Usuario usuario = buscar(id);
        usuarioRepository.delete(usuario);
        usuarioRepository.flush();
    }

    private Usuario buscar(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
    }

    private void validarUnicos(UsuarioRequest r, Long idExcluido) {
        String correo = r.correo().trim();
        String run = r.run().trim().toUpperCase();

        boolean correoUsado = idExcluido == null
                ? usuarioRepository.existsByCorreoIgnoreCase(correo)
                : usuarioRepository.existsByCorreoIgnoreCaseAndIdNot(correo, idExcluido);
        if (correoUsado) {
            throw new BusinessException("El correo ya está registrado", HttpStatus.CONFLICT);
        }

        boolean runUsado = idExcluido == null
                ? usuarioRepository.existsByRun(run)
                : usuarioRepository.existsByRunAndIdNot(run, idExcluido);
        if (runUsado) {
            throw new BusinessException("El RUN ya está registrado", HttpStatus.CONFLICT);
        }
    }

    private void aplicar(Usuario u, UsuarioRequest r) {
        u.setRun(r.run().trim().toUpperCase());
        u.setNombre(r.nombre().trim());
        u.setApellidos(r.apellidos().trim());
        u.setCorreo(r.correo().trim().toLowerCase());
        u.setTelefono(r.telefono());
        u.setFechaNacimiento(r.fechaNacimiento());
        u.setRol(Rol.desde(r.tipoUsuario()));
        u.setRegion(r.region());
        u.setComuna(r.comuna());
        u.setDireccion(r.direccion());
    }
}
