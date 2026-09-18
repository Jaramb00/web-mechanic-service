package hr.demo.vulkanizer.reservations;

/** Kupac je rezervirao artikl. Sluša ga `notifications`. */
public record ReservationCreatedEvent(Long reservationId, Long customerId, Long productId,
                                      String productName, int quantity) {
}
