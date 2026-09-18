package hr.demo.vulkanizer.appointments.dto;

import hr.demo.vulkanizer.appointments.AppointmentStatus;
import jakarta.validation.constraints.NotNull;

public record StatusChangeRequest(@NotNull(message = "Status je obavezan.") AppointmentStatus status) {
}
