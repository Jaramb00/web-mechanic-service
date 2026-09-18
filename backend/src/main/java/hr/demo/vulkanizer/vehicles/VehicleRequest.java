package hr.demo.vulkanizer.vehicles;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Vozilo koje unosi korisnik. Nema polje `userId` — vlasnik se uvijek uzima iz
 * prijavljenog korisnika, pa se vozilo ne može podmetnuti tuđem računu.
 */
public record VehicleRequest(
        @NotBlank(message = "Marka je obavezna.") @Size(max = 80) String make,
        @NotBlank(message = "Model je obavezan.") @Size(max = 80) String model,
        @Min(value = 1900, message = "Godina nije ispravna.")
        @Max(value = 2100, message = "Godina nije ispravna.") Integer modelYear,
        @NotBlank(message = "Registracija je obavezna.")
        @Size(max = 20)
        @Pattern(regexp = "^[A-Za-z0-9ČĆŽŠĐčćžšđ -]{4,20}$", message = "Registracija nije ispravnog oblika.")
        String registration,
        @Size(max = 40) String tireSize,
        @Size(max = 32)
        @Pattern(regexp = "^$|^[A-HJ-NPR-Z0-9]{11,17}$", message = "VIN nije ispravnog oblika.")
        String vin) {
}
