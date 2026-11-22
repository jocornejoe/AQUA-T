package com.aquat.api.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.aquat.api.model.Categoria;
import com.aquat.api.model.Producto;
import com.aquat.api.model.Rol;
import com.aquat.api.model.Usuario;
import com.aquat.api.repository.CategoriaRepository;
import com.aquat.api.repository.ProductoRepository;
import com.aquat.api.repository.UsuarioRepository;


@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean habilitado;
    private final String claveEjemplo;

    public DataInitializer(CategoriaRepository categoriaRepository, ProductoRepository productoRepository,
                           UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                           @Value("${app.seed.enabled}") boolean habilitado,
                           @Value("${app.seed.password}") String claveEjemplo) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.habilitado = habilitado;
        this.claveEjemplo = claveEjemplo;
    }

    @Override
    public void run(String... args) {
        if (!habilitado) {
            return;
        }

        for (String nombre : List.of("Filtros", "Bombas", "Accesorios", "Piscinas", "Químicos")) {
            if (categoriaRepository.findByNombreIgnoreCase(nombre).isEmpty()) {
                Categoria categoria = new Categoria();
                categoria.setNombre(nombre);
                categoriaRepository.save(categoria);
            }
        }

        if (usuarioRepository.count() == 0) {
            String region = "Región Metropolitana de Santiago";
            crearUsuario("211567899", "Iván", "Rivera", "ivan.rivera@duoc.cl",
                    LocalDate.of(2002, 10, 25), Rol.ADMINISTRADOR, region, "Santiago", "Lomas Ticas 123");
            crearUsuario("128493456", "Jose", "Cornejo", "jose.cornejo@gmail.com",
                    LocalDate.of(1998, 11, 2), Rol.VENDEDOR, region, "Puente Alto", "Puente Asalto 456");
            crearUsuario("205671234", "Jose", "Cisternas", "jose.cisternas@gmail.com",
                    LocalDate.of(2000, 2, 20), Rol.CLIENTE, "Región del Biobío", "Concepción", "Lomas turbas 789");
            log.info("Usuarios de ejemplo creados (contraseña definida en SEED_PASSWORD)");
        }

        if (productoRepository.count() == 0) {
            crearProducto("filtro-vulcano-20", "AQT-001", "Filtro VC VULCANO 20", "Filtro Vulcano",
                    "120000", null, null, "Filtros", "/assetsimg/filtro1.jpg");
            crearProducto("equipo-limpiado", "AQT-004", "Equipo de limpiado", "Equipo de limpiado y aspirado",
                    "499990", null, null, "Accesorios", "/assetsimg/equipofiltro.jpg");
            crearProducto("bomba-apm37", "AQT-007", "Bomba periférica APm37 0,5Hp 220V Leo",
                    "Bomba periférica APm37 0,5Hp 220V Leo", "80000", null, null, "Bombas", "/assetsimg/bomba.webp");
            crearProducto("cloro-granulado", "AQT-010", "Pack 2 Unidades Cloro Granulado 1 Kg",
                    "Pack 2 Unidades Cloro Granulado Para Piscinas 1 Kg", "19990", null, null, "Químicos",
                    "/assetsimg/cloro.webp");
            crearProducto("bomba-flowclear", "AQT-011", "Bomba De Filtrado 5678 Litros Flowclear Bestway",
                    "Bomba de filtrado Flowclear Bestway", "77990", null, null, "Bombas", "/assetsimg/filtro5.webp");
            crearProducto("clarificador-piscina", "AQT-012", "Clarificador para Piscina Granulado 1 Bolsa",
                    "Clarificador para Piscina Granulado 1 Bolsa", "2397", "7990", "-70%", "Químicos",
                    "/assetsimg/clarificador.webp");
            log.info("Productos de ejemplo creados");
        }
    }

    private void crearUsuario(String run, String nombre, String apellidos, String correo, LocalDate nacimiento,
                              Rol rol, String region, String comuna, String direccion) {
        Usuario u = new Usuario();
        u.setRun(run);
        u.setNombre(nombre);
        u.setApellidos(apellidos);
        u.setCorreo(correo);
        u.setContrasenaHash(passwordEncoder.encode(claveEjemplo));
        u.setFechaNacimiento(nacimiento);
        u.setRol(rol);
        u.setRegion(region);
        u.setComuna(comuna);
        u.setDireccion(direccion);
        usuarioRepository.save(u);
    }

    private void crearProducto(String id, String codigo, String nombre, String descripcion, String precio,
                               String precioAnterior, String descuento, String categoria, String imagen) {
        Producto p = new Producto();
        p.setId(id);
        p.setCodigo(codigo);
        p.setNombre(nombre);
        p.setDescripcion(descripcion);
        p.setPrecio(new BigDecimal(precio));
        p.setPrecioAnterior(precioAnterior == null ? null : new BigDecimal(precioAnterior));
        p.setDescuento(descuento);
        p.setImagen(imagen);
        p.setCategoria(categoriaRepository.findByNombreIgnoreCase(categoria).orElseThrow());
        productoRepository.save(p);
    }
}
