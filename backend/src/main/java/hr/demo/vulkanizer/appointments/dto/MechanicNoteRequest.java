package hr.demo.vulkanizer.appointments.dto;

import jakarta.validation.constraints.Size;

public record MechanicNoteRequest(@Size(max = 2000, message = "Napomena je predugačka.") String note) {
}
