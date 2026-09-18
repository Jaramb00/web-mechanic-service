package hr.demo.vulkanizer.inventory;

import java.math.BigDecimal;

/**
 * Artikl za javni prikaz i za kupca.
 *
 * Namjerno NE sadrži nabavnu cijenu ni fizičko/rezervirano stanje — kupcu je
 * relevantna samo raspoloživa količina. Ovo je "trim" iz sigurnosnih zahtjeva:
 * podatak koji ne izađe iz backenda ne može procuriti.
 */
public record ProductView(
        Long id,
        String sku,
        String name,
        String manufacturer,
        String categoryCode,
        String categoryName,
        String description,
        String tireSize,
        BigDecimal salePrice,
        int availableQuantity,
        boolean active) {
}
