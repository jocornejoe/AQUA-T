package com.aquat.api.dto;

import com.aquat.api.model.Usuario;
import java.time.LocalDate;

public record UsuarioResponse(
        Long id,
        String run,
        String nombre,
        String apellidos,
        String correo,
        String telefono,
        LocalDate fechaNacimiento,
        String tipoUsuario,
        String region,
        String comuna,
        String direccion) {

    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(
                u.getId(), u.getRun(), u.getNombre(), u.getApellidos(), u.getCorreo(),
                u.getTelefono(), u.getFechaNacimiento(), u.getRol().getEtiqueta(),
                u.getRegion(), u.getComuna(), u.getDireccion());
    }
}
