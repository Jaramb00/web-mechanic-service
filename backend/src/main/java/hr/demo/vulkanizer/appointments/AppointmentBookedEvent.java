package hr.demo.vulkanizer.appointments;

import java.time.Instant;

/**
 * Termin je uspješno rezerviran. Sluša ga `notifications`.
 *
 * Nosi `vehicleId` i `customerNote` jer dojava servisu bez podatka o kojem je
 * autu riječ i što je kupac napisao traži dodatni odlazak u bazu za svaku
 * rezervaciju — a oba podatka su u trenutku upisa već u ruci.
 */
public record AppointmentBookedEvent(Long appointmentId, Long customerId, Long vehicleId,
                                     Long serviceId, Instant startAt, String customerNote) {
}
