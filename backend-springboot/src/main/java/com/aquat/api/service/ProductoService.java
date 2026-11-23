package com.aquat.api.service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquat.api.dto.ProductoRequest;
import com.aquat.api.dto.ProductoResponse;
import com.aquat.api.exception.BusinessException;
import com.aquat.api.exception.ResourceNotFoundException;
import com.aquat.api.model.Categoria;
import com.aquat.api.model.Producto;
import com.aquat.api.repository.CategoriaRepository;
import com.aquat.api.repository.ProductoRepository;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    public ProductoService(ProductoRepository productoRepository, CategoriaRepository categoriaRepository) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> listar() {
        return productoRepository.findAll().stream().map(ProductoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ProductoResponse obtener(String id) {
        return ProductoResponse.from(buscar(id));
    }

    @Transactional
    public ProductoResponse crear(ProductoRequest request) {
        Producto producto = new Producto();
        producto.setId(generarId(request.nombre()));
        producto.setCodigo(generarCodigo());
        aplicar(producto, request);
        return ProductoResponse.from(productoRepository.save(producto));
    }

    @Transactional
    public ProductoResponse actualizar(String id, ProductoRequest request) {
        Producto producto = buscar(id);
        aplicar(producto, request);
        return ProductoResponse.from(productoRepository.save(producto));
    }

    @Transactional
    public void eliminar(String id) {
        Producto producto = buscar(id);
        productoRepository.delete(producto);
        productoRepository.flush();
    }

    private Producto buscar(String id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));
    }

    private void aplicar(Producto producto, ProductoRequest r) {
        Categoria categoria = categoriaRepository.findByNombreIgnoreCase(r.categoria())
                .orElseThrow(() -> new BusinessException(
                        "La categoría no existe: " + r.categoria(), HttpStatus.BAD_REQUEST));

        producto.setNombre(r.nombre().trim());
        producto.setDescripcion(r.descripcion());
        producto.setPrecio(r.precio());
        producto.setPrecioAnterior(r.precioAnterior());
        producto.setDescuento(r.descuento());
        producto.setStock(r.stock());
        if (r.stockCritico() != null) {
            producto.setStockCritico(r.stockCritico());
        }
        producto.setImagen(r.imagen());
        producto.setCategoria(categoria);
    }

    private String generarId(String nombre) {
        String base = slug(nombre);
        String candidato = base;
        int n = 2;
        while (productoRepository.existsById(candidato)) {
            candidato = base + "-" + n++;
        }
        return candidato;
    }

    private String generarCodigo() {
        long n = productoRepository.count() + 1;
        String codigo;
        do {
            codigo = String.format("AQT-%03d", n++);
        } while (productoRepository.existsByCodigo(codigo));
        return codigo;
    }

    static String slug(String texto) {
        String sinTildes = Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String slug = sinTildes.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return slug.isEmpty() ? "producto" : slug;
    }
}
