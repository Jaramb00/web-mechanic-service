package hr.demo.vulkanizer.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Ime i prezime je obavezno.")
        @Size(min = 2, max = 160)
        String fullName,

        @Size(max = 32)
        @Pattern(regexp = "^$|^[+0-9 ()/-]{6,32}$", message = "Broj telefona nije ispravnog oblika.")
        String phone) {
}
