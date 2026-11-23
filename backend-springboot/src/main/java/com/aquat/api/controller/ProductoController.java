package com.aquat.api.controller;

import com.aquat.api.dto.ProductoRequest;
import com.aquat.api.dto.ProductoResponse;
import com.aquat.api.service.ProductoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/productos")
@Tag(name = "Productos", description = "Catálogo (público). Crear, editar y eliminar: solo Administrador")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @Operation(summary = "Listar productos")
    @GetMapping
    public List<ProductoResponse> listar() {
        return productoService.listar();
    }

    @Operation(summary = "Detalle de un producto")
    @GetMapping("/{id}")
    public ProductoResponse obtener(@PathVariable String id) {
        return productoService.obtener(id);
    }

    @Operation(summary = "Crear producto (Administrador)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoResponse crear(@Valid @RequestBody ProductoRequest request) {
        return productoService.crear(request);
    }

    @Operation(summary = "Actualizar producto (Administrador)")
    @PutMapping("/{id}")
    public ProductoResponse actualizar(@PathVariable String id, @Valid @RequestBody ProductoRequest request) {
        return productoService.actualizar(id, request);
    }

    @Operation(summary = "Eliminar producto (Administrador)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable String id) {
        productoService.eliminar(id);
    }
}
