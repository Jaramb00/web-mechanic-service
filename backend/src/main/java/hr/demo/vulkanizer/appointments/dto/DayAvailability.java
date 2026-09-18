package hr.demo.vulkanizer.appointments.dto;

import java.time.LocalDate;
import java.util.List;

public record DayAvailability(LocalDate date, boolean closed, String note, List<SlotView> slots) {
}
