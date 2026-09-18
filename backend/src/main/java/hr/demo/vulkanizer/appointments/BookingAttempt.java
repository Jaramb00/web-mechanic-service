package hr.demo.vulkanizer.appointments;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Jedan pokušaj upisa termina na konkretno radno mjesto, u zasebnoj transakciji.
 *
 * Zašto REQUIRES_NEW: kad EXCLUDE constraint odbije upis, PostgreSQL prekida
 * cijelu tekuću transakciju — u istoj se transakciji ne može "pokušati sljedeće
 * radno mjesto". Svaki pokušaj zato dobiva vlastitu transakciju, pa neuspjeh
 * jednog ne ruši ostale.
 */
@Component
class BookingAttempt {

    private final AppointmentRepository appointments;
    private final ApplicationEventPublisher events;

    BookingAttempt(AppointmentRepository appointments, ApplicationEventPublisher events) {
        this.appointments = appointments;
        this.events = events;
    }

    /**
     * Baca {@link org.springframework.dao.DataIntegrityViolationException} ako je
     * radno mjesto zauzeto; pozivatelj to tumači kao "probaj sljedeće".
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    Long insert(Long customerId, Long vehicleId, Long serviceId, Long bayId,
                Instant startAt, Instant endAt, String customerNote) {
        Appointment saved = appointments.saveAndFlush(
                new Appointment(customerId, vehicleId, serviceId, bayId, startAt, endAt, customerNote));
        events.publishEvent(new AppointmentBookedEvent(saved.getId(), customerId, serviceId, startAt));
        return saved.getId();
    }
}
