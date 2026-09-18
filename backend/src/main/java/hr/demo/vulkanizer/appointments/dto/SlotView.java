package hr.demo.vulkanizer.appointments.dto;

import java.time.Instant;

/** Jedan mogući termin. `freeBays` pokazuje koliko je radnih mjesta još slobodno. */
public record SlotView(Instant startAt, Instant endAt, boolean available, int freeBays) {
}
