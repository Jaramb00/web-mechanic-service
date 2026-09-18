package hr.demo.vulkanizer.reservations;

import java.util.EnumSet;
import java.util.Set;

/** Životni ciklus rezervacije artikla. */
public enum ReservationStatus {
    /** Zaprimljena, roba je rezervirana na skladištu. */
    PENDING,
    /** Servis je potvrdio rezervaciju. */
    CONFIRMED,
    /** Roba je izdana kupcu — skida se sa stanja. */
    FULFILLED,
    /** Otkazana — rezervirana količina se oslobađa. */
    CANCELLED;

    /** Statusi koji još drže robu rezerviranom. */
    public static final Set<ReservationStatus> HOLDING = EnumSet.of(PENDING, CONFIRMED);

    public boolean isHolding() {
        return HOLDING.contains(this);
    }
}
