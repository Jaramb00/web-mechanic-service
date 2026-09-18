package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.config.AppProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

/** Pravila koja frontend treba znati unaprijed — npr. smije li se termin još otkazati. */
@Component
class AppointmentBookingRules {

    private final Duration cancelCutoff;

    AppointmentBookingRules(AppProperties properties) {
        this.cancelCutoff = Duration.ofHours(properties.booking().cancelCutoffHours());
    }

    boolean isCancellableNow(AppointmentStatus status, Instant startAt) {
        if (status != AppointmentStatus.PENDING && status != AppointmentStatus.CONFIRMED) {
            return false;
        }
        return Instant.now().plus(cancelCutoff).isBefore(startAt);
    }
}
