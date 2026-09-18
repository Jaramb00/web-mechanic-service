package hr.demo.vulkanizer.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Trenutna lozinka je obavezna.")
        String currentPassword,

        @NotBlank(message = "Nova lozinka je obavezna.")
        @Size(min = 8, max = 200, message = "Lozinka mora imati barem 8 znakova.")
        @Pattern(regexp = ".*\\d.*", message = "Lozinka mora sadržavati barem jednu znamenku.")
        String newPassword) {
}
