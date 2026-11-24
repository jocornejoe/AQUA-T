package com.aquat.api.security;

import com.aquat.api.model.Usuario;
import com.aquat.api.repository.UsuarioRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthFilter(
            JwtService jwtService,
            UsuarioRepository usuarioRepository
    ) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        String cabecera = request.getHeader("Authorization");

        if (cabecera != null && cabecera.startsWith("Bearer ")) {

            SecurityContextHolder.clearContext();

            try {
                String token = cabecera.substring(7);

                Claims claims = jwtService.leer(token);

                String correo = claims.getSubject();
                String rolDelToken = claims.get("rol", String.class);
                Object identificador = claims.get("uid");

                if (
                        correo != null &&
                        rolDelToken != null &&
                        identificador instanceof Number
                ) {

                    long idDelToken =
                            ((Number) identificador).longValue();

                    Optional<Usuario> resultado =
                            usuarioRepository.findByCorreoIgnoreCase(
                                    correo
                            );

                    if (resultado.isPresent()) {

                        Usuario usuario = resultado.get();

                        boolean mismoUsuario =
                                usuario.getId() != null &&
                                usuario.getId().equals(idDelToken);

                        boolean mismoRol =
                                usuario.getRol() != null &&
                                usuario.getRol().name()
                                        .equals(rolDelToken);

                        /*
                         * Si el usuario fue eliminado,
                         * cambió de rol o cambió su
                         * identidad, no conservamos
                         * permisos del JWT anterior.
                         */
                        if (mismoUsuario && mismoRol) {

                            var autoridad =
                                    new SimpleGrantedAuthority(
                                            "ROLE_" +
                                            usuario.getRol().name()
                                    );

                            var autenticacion =
                                    new UsernamePasswordAuthenticationToken(
                                            usuario.getCorreo(),
                                            null,
                                            List.of(autoridad)
                                    );

                            SecurityContextHolder
                                    .getContext()
                                    .setAuthentication(autenticacion);
                        }
                    }
                }

            } catch (
                    JwtException |
                    IllegalArgumentException ex
            ) {
                SecurityContextHolder.clearContext();
            }
        }

        chain.doFilter(request, response);
    }
}