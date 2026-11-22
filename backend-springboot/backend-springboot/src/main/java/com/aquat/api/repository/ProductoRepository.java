package com.aquat.api.repository;

import com.aquat.api.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductoRepository extends JpaRepository<Producto, String> {

    boolean existsByCodigo(String codigo);
}
