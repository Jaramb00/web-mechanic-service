package hr.demo.vulkanizer.appointments.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Evidentiranje utroška na terminu.
 *
 * Nema polje za cijenu — cijena se uvijek uzima sa servera (iz cjenika ili
 * šifrarnika artikala) i snima kao snapshot. Majstor ne određuje cijenu kroz
 * request body.
 */
public record AppointmentItemRequest(
        Long productId,
        Long serviceId,
        @NotNull(message = "Količina je obavezna.")
        @Min(value = 1, message = "Količina mora biti barem 1.") Integer quantity) {
}
