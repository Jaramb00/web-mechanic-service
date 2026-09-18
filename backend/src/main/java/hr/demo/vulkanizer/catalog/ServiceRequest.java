package hr.demo.vulkanizer.catalog;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Unos/izmjena usluge. Dostupno samo administratoru. */
public record ServiceRequest(
        @NotBlank(message = "Naziv usluge je obavezan.") @Size(max = 120) String name,
        @Size(max = 1000) String description,
        @NotNull(message = "Cijena je obavezna.")
        @DecimalMin(value = "0.00", message = "Cijena ne može biti negativna.")
        @Digits(integer = 10, fraction = 2) BigDecimal price,
        @NotNull @Min(value = 10, message = "Trajanje mora biti barem 10 minuta.")
        @Max(value = 480, message = "Trajanje ne može biti dulje od 8 sati.") Integer durationMinutes,
        boolean active,
        @Min(0) int sortOrder) {
}
