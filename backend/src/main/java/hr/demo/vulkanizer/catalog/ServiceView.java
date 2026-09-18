package hr.demo.vulkanizer.catalog;

import java.math.BigDecimal;

/** Usluga kakvu vidi javna stranica i booking. */
public record ServiceView(Long id, String name, String description, BigDecimal price,
                          int durationMinutes, boolean active, int sortOrder) {
}
