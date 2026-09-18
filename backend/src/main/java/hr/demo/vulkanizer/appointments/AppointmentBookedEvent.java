package hr.demo.vulkanizer.appointments;

import java.time.Instant;

/** Termin je uspješno rezerviran. Sluša ga `notifications`. */
public record AppointmentBookedEvent(Long appointmentId, Long customerId, Long serviceId, Instant startAt) {
}
