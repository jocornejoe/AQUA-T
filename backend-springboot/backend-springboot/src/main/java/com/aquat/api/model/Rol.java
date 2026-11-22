package com.aquat.api.model;

public enum Rol {
    ADMINISTRADOR("Administrador"),
    VENDEDOR("Vendedor"),
    CLIENTE("Cliente");

    private final String etiqueta;

    Rol(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    /** Acepta "ADMINISTRADOR" o "Administrador" (sin distinguir mayúsculas). */
    public static Rol desde(String texto) {
        for (Rol rol : values()) {
            if (rol.name().equalsIgnoreCase(texto) || rol.etiqueta.equalsIgnoreCase(texto)) {
                return rol;
            }
        }
        throw new IllegalArgumentException("Tipo de usuario no válido: " + texto);
    }
}
