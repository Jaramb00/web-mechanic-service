package hr.demo.vulkanizer.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Korekcija na stvarno stanje nakon inventure.
 * Razlog je obavezan — korekcija bez objašnjenja je rupa u reviziji.
 */
public record StockAdjustmentRequest(
        @NotNull(message = "Artikl je obavezan.") Long productId,
        @NotNull(message = "Novo stanje je obavezno.")
        @Min(value = 0, message = "Stanje ne može biti negativno.") Integer newQuantity,
        @NotBlank(message = "Razlog korekcije je obavezan.") @Size(max = 500) String note) {
}
