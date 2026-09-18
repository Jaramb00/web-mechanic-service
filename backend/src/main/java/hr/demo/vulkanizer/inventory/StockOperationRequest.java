package hr.demo.vulkanizer.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Zaprimanje ili izdavanje robe. */
public record StockOperationRequest(
        @NotNull(message = "Artikl je obavezan.") Long productId,
        @NotNull(message = "Količina je obavezna.")
        @Min(value = 1, message = "Količina mora biti barem 1.") Integer quantity,
        @Size(max = 500) String note) {
}
