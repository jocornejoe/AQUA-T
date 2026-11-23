package com.aquat.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class ProductoServiceTest {

    @Test
    void slugQuitaTildesEspaciosYSimbolos() {
        assertEquals("bomba-periferica-apm37", ProductoService.slug("Bomba periférica APm37"));
    }

    @Test
    void slugDeTextoVacioUsaValorPorDefecto() {
        assertEquals("producto", ProductoService.slug("***"));
    }
}
