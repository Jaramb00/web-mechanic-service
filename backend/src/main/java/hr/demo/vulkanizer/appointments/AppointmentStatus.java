package hr.demo.vulkanizer.appointments;

import java.util.EnumSet;
import java.util.Set;

/** Životni ciklus servisnog termina. */
public enum AppointmentStatus {
    /** Zaprimljen, čeka potvrdu servisa. */
    PENDING,
    /** Servis je potvrdio termin. */
    CONFIRMED,
    /** Vozilo je na dizalici. */
    IN_PROGRESS,
    /** Odrađeno. */
    COMPLETED,
    /** Otkazano — oslobađa termin. */
    CANCELLED,
    /** Stranka se nije pojavila — također oslobađa termin. */
    NO_SHOW;

    /** Statusi koji drže termin zauzetim (isti skup kao u EXCLUDE constraintu). */
    public static final Set<AppointmentStatus> BLOCKING =
            EnumSet.of(PENDING, CONFIRMED, IN_PROGRESS, COMPLETED);

    public boolean isBlocking() {
        return BLOCKING.contains(this);
    }

    public boolean isFinal() {
        return this == COMPLETED || this == CANCELLED || this == NO_SHOW;
    }

    /** Dopušteni prijelazi. Servis ne smije preskakati korake unatrag. */
    public boolean canTransitionTo(AppointmentStatus target) {
        return switch (this) {
            case PENDING -> target == CONFIRMED || target == CANCELLED || target == NO_SHOW;
            case CONFIRMED -> target == IN_PROGRESS || target == CANCELLED || target == NO_SHOW;
            case IN_PROGRESS -> target == COMPLETED || target == CANCELLED;
            case COMPLETED, CANCELLED, NO_SHOW -> false;
        };
    }
}
