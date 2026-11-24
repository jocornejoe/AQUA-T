package com.aquat.api.config;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.aquat.api.security.JwtAuthFilter;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final String origenesPermitidos;

    public SecurityConfig(
            JwtAuthFilter jwtAuthFilter,
            @Value("${app.cors.allowed-origins}")
            String origenesPermitidos
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.origenesPermitidos = origenesPermitidos;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())

                .sessionManagement(s ->
                        s.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        /*
                         * Debe ir ANTES de auth/**,
                         * porque la renovación requiere
                         * un JWT vigente.
                         */
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/auth/renovar"
                        ).authenticated()

                        .requestMatchers(
                                "/api/v1/auth/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/productos/**",
                                "/api/v1/categorias/**"
                        ).permitAll()

                        .requestMatchers(
                                "/api/v1/productos/**"
                        ).hasRole("ADMINISTRADOR")

                        .requestMatchers(
                                "/api/v1/usuarios/**"
                        ).hasRole("ADMINISTRADOR")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/boletas/mias"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/boletas"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/boletas",
                                "/api/v1/boletas/**"
                        ).hasAnyRole(
                                "ADMINISTRADOR",
                                "VENDEDOR"
                        )

                        .requestMatchers(
                                "/api/v1/boletas/**"
                        ).hasRole("ADMINISTRADOR")

                        .anyRequest().authenticated()
                )

                .exceptionHandling(e -> e

                        .authenticationEntryPoint(
                                (req, res, ex) ->
                                        escribirError(
                                                res,
                                                HttpServletResponse.SC_UNAUTHORIZED,
                                                "Debes iniciar sesión"
                                        )
                        )

                        .accessDeniedHandler(
                                (req, res, ex) ->
                                        escribirError(
                                                res,
                                                HttpServletResponse.SC_FORBIDDEN,
                                                "No tienes permisos para esta acción"
                                        )
                        )
                )

                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(
                Arrays.stream(origenesPermitidos.split(","))
                        .map(String::trim)
                        .filter(o -> !o.isEmpty())
                        .toList()
        );

        config.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        config.setAllowedHeaders(
                List.of("Authorization", "Content-Type")
        );

        UrlBasedCorsConfigurationSource fuente =
                new UrlBasedCorsConfigurationSource();

        fuente.registerCorsConfiguration(
                "/**",
                config
        );

        return fuente;
    }

    private static void escribirError(
            HttpServletResponse res,
            int estado,
            String mensaje
    ) throws IOException {

        res.setStatus(estado);
        res.setContentType("application/json;charset=UTF-8");

        res.getWriter().write(
                "{\"error\":\"" + mensaje + "\"}"
        );
    }
}