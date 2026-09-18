package hr.demo.vulkanizer.reservations;

import java.math.BigDecimal;
import java.time.Instant;

public record ReservationView(
        Long id,
        Long customerId,
        String customerName,
        Long productId,
        String productSku,
        String productName,
        Long appointmentId,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal total,
        ReservationStatus status,
        String pickupNote,
        boolean cancellable,
        Instant createdAt) {
}
