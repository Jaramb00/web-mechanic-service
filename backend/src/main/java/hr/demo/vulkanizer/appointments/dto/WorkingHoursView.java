package hr.demo.vulkanizer.appointments.dto;

import java.time.LocalTime;

public record WorkingHoursView(int dayOfWeek, LocalTime openTime, LocalTime closeTime, boolean closed) {
}
