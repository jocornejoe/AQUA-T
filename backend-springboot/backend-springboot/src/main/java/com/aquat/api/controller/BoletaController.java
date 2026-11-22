package com.aquat.api.controller;

import com.aquat.api.dto.BoletaRequest;
import com.aquat.api.dto.BoletaResponse;
import com.aquat.api.dto.EstadoRequest;
import com.aquat.api.service.BoletaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/boletas")
@Tag(name = "Boletas", description = "Órdenes de compra. Listar y ver detalle: Administrador y Vendedor")
public class BoletaController {

    private final BoletaService boletaService;

    public BoletaController(BoletaService boletaService) {
        this.boletaService = boletaService;
    }

    @Operation(summary = "Crear boleta (compra)",
            description = "Requiere sesión. Valida stock, toma los precios de la BD y descuenta inventario")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BoletaResponse crear(@Valid @RequestBody BoletaRequest request, Authentication autenticacion) {
        return boletaService.crear(request, autenticacion.getName());
    }

    @Operation(summary = "Mis boletas", description = "Boletas del usuario que inició sesión")
    @GetMapping("/mias")
    public List<BoletaResponse> mias(Authentication autenticacion) {
        return boletaService.listarPorCorreo(autenticacion.getName());
    }

    @Operation(summary = "Listar todas las boletas (Administrador y Vendedor)")
    @GetMapping
    public List<BoletaResponse> listar() {
        return boletaService.listar();
    }

    @Operation(summary = "Detalle de una boleta (Administrador y Vendedor)")
    @GetMapping("/{id}")
    public BoletaResponse obtener(@PathVariable Long id) {
        return boletaService.obtener(id);
    }

    @Operation(summary = "Cambiar estado de una boleta (Administrador)",
            description = "Estados: Confirmado, Enviado, Entregado, Cancelado")
    @PatchMapping("/{id}/estado")
    public BoletaResponse cambiarEstado(@PathVariable Long id, @Valid @RequestBody EstadoRequest request) {
        return boletaService.cambiarEstado(id, request.estado());
    }
}
