package hr.demo.vulkanizer.inventory;

/** Objavljuje se kad artikl padne ispod minimalne zalihe. */
public record LowStockEvent(Long productId, String sku, String name, int availableQuantity, int minQuantity) {
}
