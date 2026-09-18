package hr.demo.vulkanizer.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "E-mail je obavezan.")
        @Email(message = "E-mail nije ispravnog oblika.")
        @Size(max = 255)
        String email,

        @NotBlank(message = "Lozinka je obavezna.")
        @Size(max = 200)
        String password) {
}
