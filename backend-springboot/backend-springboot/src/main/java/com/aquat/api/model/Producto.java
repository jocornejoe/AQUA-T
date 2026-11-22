package com.aquat.api.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @Column(length = 100)
    private String id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 500)
    private String descripcion;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(name = "precio_anterior", precision = 12, scale = 2)
    private BigDecimal precioAnterior;

    @Column(length = 20)
    private String descuento;

    @Column(nullable = false)
    private Integer stock = 20;

    @Column(name = "stock_critico")
    private Integer stockCritico = 5;

    @Column(length = 255)
    private String imagen;

    @ManyToOne(optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    public String getId() { return id; }

    public void setId(String id) { this.id = id; }

    public String getCodigo() { return codigo; }

    public void setCodigo(String codigo) { this.codigo = codigo; }

    public String getNombre() { return nombre; }

    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }

    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public BigDecimal getPrecio() { return precio; }

    public void setPrecio(BigDecimal precio) { this.precio = precio; }

    public BigDecimal getPrecioAnterior() { return precioAnterior; }

    public void setPrecioAnterior(BigDecimal precioAnterior) { this.precioAnterior = precioAnterior; }

    public String getDescuento() { return descuento; }

    public void setDescuento(String descuento) { this.descuento = descuento; }

    public Integer getStock() { return stock; }

    public void setStock(Integer stock) { this.stock = stock; }

    public Integer getStockCritico() { return stockCritico; }

    public void setStockCritico(Integer stockCritico) { this.stockCritico = stockCritico; }

    public String getImagen() { return imagen; }

    public void setImagen(String imagen) { this.imagen = imagen; }

    public Categoria getCategoria() { return categoria; }

    public void setCategoria(Categoria categoria) { this.categoria = categoria; }
}
