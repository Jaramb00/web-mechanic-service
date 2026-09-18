package hr.demo.vulkanizer.appointments;

/** Status termina je promijenjen. Sluša ga `notifications`. */
public record AppointmentStatusChangedEvent(Long appointmentId, Long customerId,
                                            AppointmentStatus previous, AppointmentStatus current) {
}
