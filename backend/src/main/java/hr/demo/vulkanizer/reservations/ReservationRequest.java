package hr.demo.vulkanizer.reservations;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Rezervacija artikla.
 *
 * Nema polje za cijenu — cijena se uzima iz šifrarnika na serveru. Nema ni
 * `customerId` ni `status`; oboje određuje server.
 */
public record ReservationRequest(
        @NotNull(message = "Odaberite artikl.") Long productId,
        @NotNull(message = "Količina je obavezna.")
        @Min(value = 1, message = "Količina mora biti barem 1.")
        @Max(value = 100, message = "Za veće količine kontaktirajte servis.") Integer quantity,
        /** Neobavezno: vezanje rezervacije uz vlastiti termin. */
        Long appointmentId,
        @Size(max = 500, message = "Napomena je predugačka.") String pickupNote) {
}
