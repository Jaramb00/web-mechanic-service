package hr.demo.vulkanizer.inventory;

import java.time.Instant;

public record StockMovementView(
        Long id,
        Long productId,
        String productSku,
        String productName,
        MovementType movementType,
        int deltaPhysical,
        int deltaReserved,
        String referenceType,
        Long referenceId,
        Long createdBy,
        String note,
        Instant createdAt) {
}
