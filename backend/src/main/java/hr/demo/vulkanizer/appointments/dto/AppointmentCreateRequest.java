package hr.demo.vulkanizer.appointments.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Rezervacija termina.
 *
 * Nema `status` (uvijek PENDING), nema `customerId` (uzima se iz prijave),
 * nema `endAt` (računa se iz trajanja usluge) i nema `bayId` (server bira
 * slobodno radno mjesto). Klijent ne može utjecati ni na jedno od toga.
 */
public record AppointmentCreateRequest(
        @NotNull(message = "Odaberite uslugu.") Long serviceId,
        @NotNull(message = "Odaberite vozilo.") Long vehicleId,
        @NotNull(message = "Odaberite termin.") Instant startAt,
        @Size(max = 1000, message = "Napomena je predugačka.") String customerNote,

        /** Honeypot — vidi RegisterRequest. Provjerava se u servisu. */
        String website) {
}
