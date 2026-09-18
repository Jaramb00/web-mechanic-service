package hr.demo.vulkanizer.appointments.dto;

import hr.demo.vulkanizer.appointments.AppointmentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Termin za prikaz.
 *
 * Podaci o kupcu (ime, telefon) popunjavaju se samo za osoblje — kupac ih o
 * sebi ionako zna, a drugi kupci ih ne smiju vidjeti.
 */
public record AppointmentView(
        Long id,
        Long customerId,
        String customerName,
        String customerPhone,
        Long vehicleId,
        String vehicleLabel,
        String vehicleTireSize,
        Long serviceId,
        String serviceName,
        String bayName,
        Instant startAt,
        Instant endAt,
        AppointmentStatus status,
        String customerNote,
        String mechanicNote,
        List<AppointmentItemView> items,
        BigDecimal itemsTotal,
        boolean cancellable) {
}
