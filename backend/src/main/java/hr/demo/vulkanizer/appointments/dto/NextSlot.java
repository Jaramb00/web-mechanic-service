package hr.demo.vulkanizer.appointments.dto;

import java.time.Instant;

/**
 * Prvi slobodan termin u servisu. Javna stranica ovo pokazuje kao činjenicu
 * umjesto obećanja, pa uz vrijeme nosi i uslugu na koju se odnosi.
 */
public record NextSlot(Instant startAt, Instant endAt, Long serviceId, String serviceName, int freeBays) {
}
