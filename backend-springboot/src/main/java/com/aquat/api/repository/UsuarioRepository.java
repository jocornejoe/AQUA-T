package com.aquat.api.repository;

import com.aquat.api.model.Usuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCase(String correo);

    boolean existsByRun(String run);

    boolean existsByCorreoIgnoreCaseAndIdNot(String correo, Long id);

    boolean existsByRunAndIdNot(String run, Long id);

    Optional<Usuario> findByGoogleSub(String googleSub);
}
