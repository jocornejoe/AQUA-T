package com.aquat.api.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Guarda el rol como 'Administrador', 'Vendedor' o 'Cliente', igual que el ENUM de MySQL. */
@Converter
public class RolConverter implements AttributeConverter<Rol, String> {

    @Override
    public String convertToDatabaseColumn(Rol rol) {
        return rol == null ? null : rol.getEtiqueta();
    }

    @Override
    public Rol convertToEntityAttribute(String valor) {
        return valor == null ? null : Rol.desde(valor);
    }
}
