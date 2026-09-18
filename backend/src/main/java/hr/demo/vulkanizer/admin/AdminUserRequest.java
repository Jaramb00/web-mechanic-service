package hr.demo.vulkanizer.admin;

import hr.demo.vulkanizer.users.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Set;

/**
 * Kreiranje korisnika s eksplicitnim ulogama.
 *
 * Ovo je JEDINI put kojim uloga ulazi u sustav izvana — i dostupan je isključivo
 * administratoru (vidi @PreAuthorize na kontroleru). Javna registracija tu
 * mogućnost nema.
 */
public record AdminUserRequest(
        @NotBlank @Email(message = "E-mail nije ispravnog oblika.") @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 200, message = "Lozinka mora imati barem 8 znakova.")
        @Pattern(regexp = ".*\\d.*", message = "Lozinka mora sadržavati barem jednu znamenku.") String password,
        @NotBlank @Size(min = 2, max = 160) String fullName,
        @Size(max = 32) String phone,
        @NotEmpty(message = "Odaberite barem jednu ulogu.") Set<RoleName> roles) {
}
