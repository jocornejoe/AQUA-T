package com.aquat.api.dto;

import com.aquat.api.model.Categoria;

public record CategoriaResponse(Long id, String nombre) {

    public static CategoriaResponse from(Categoria c) {
        return new CategoriaResponse(c.getId(), c.getNombre());
    }
}
