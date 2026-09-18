package hr.demo.vulkanizer.inventory;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Unos/izmjena artikla. Dostupno samo administratoru.
 *
 * Nema polja `physicalQuantity` ni `reservedQuantity` — stanje se mijenja
 * isključivo kroz skladišne operacije, koje ostavljaju trag u knjizi prometa.
 * {@code initialQuantity} se koristi samo pri kreiranju i i sam postaje zapis.
 */
public record ProductRequest(
        @NotBlank(message = "Šifra artikla je obavezna.")
        @Size(max = 64)
        @Pattern(regexp = "^[A-Za-z0-9._-]{2,64}$", message = "Šifra smije sadržavati slova, brojke, točku, crticu i podvlaku.")
        String sku,

        @NotBlank(message = "Naziv je obavezan.") @Size(max = 200) String name,
        @Size(max = 120) String manufacturer,
        @NotBlank(message = "Kategorija je obavezna.") @Size(max = 40) String categoryCode,
        @Size(max = 2000) String description,
        @Size(max = 40) String tireSize,

        @NotNull(message = "Prodajna cijena je obavezna.")
        @DecimalMin(value = "0.00", message = "Cijena ne može biti negativna.")
        @Digits(integer = 10, fraction = 2) BigDecimal salePrice,

        @DecimalMin(value = "0.00", message = "Nabavna cijena ne može biti negativna.")
        @Digits(integer = 10, fraction = 2) BigDecimal purchasePrice,

        @Min(value = 0, message = "Minimalna zaliha ne može biti negativna.") int minQuantity,
        @Min(value = 0, message = "Početna količina ne može biti negativna.") Integer initialQuantity,
        boolean active) {
}
