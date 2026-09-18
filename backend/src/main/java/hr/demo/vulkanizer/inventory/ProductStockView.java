package hr.demo.vulkanizer.inventory;

import java.math.BigDecimal;

/** Puni prikaz artikla — samo za skladište i administratora. */
public record ProductStockView(
        Long id,
        String sku,
        String name,
        String manufacturer,
        String categoryCode,
        String categoryName,
        String description,
        String tireSize,
        BigDecimal salePrice,
        BigDecimal purchasePrice,
        int physicalQuantity,
        int reservedQuantity,
        int availableQuantity,
        int minQuantity,
        boolean lowStock,
        boolean active) {
}
