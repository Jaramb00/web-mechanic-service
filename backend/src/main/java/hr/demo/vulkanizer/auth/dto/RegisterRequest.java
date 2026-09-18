package hr.demo.vulkanizer.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Registracija. Namjerno NEMA polje `role` — uloga se dodjeljuje na serveru,
 * pa poslani "role": "ADMIN" ne postoji kao vektor. Uz to je uključen
 * fail-on-unknown-properties, pa takav payload uopće ne prođe deserijalizaciju.
 */
public record RegisterRequest(
        @NotBlank(message = "E-mail je obavezan.")
        @Email(message = "E-mail nije ispravnog oblika.")
        @Size(max = 255)
        String email,

        @NotBlank(message = "Lozinka je obavezna.")
        @Size(min = 8, max = 200, message = "Lozinka mora imati barem 8 znakova.")
        @Pattern(regexp = ".*[A-Za-zČĆŽŠĐčćžšđ].*", message = "Lozinka mora sadržavati barem jedno slovo.")
        @Pattern(regexp = ".*\\d.*", message = "Lozinka mora sadržavati barem jednu znamenku.")
        String password,

        @NotBlank(message = "Ime i prezime je obavezno.")
        @Size(min = 2, max = 160)
        String fullName,

        @Size(max = 32)
        @Pattern(regexp = "^$|^[+0-9 ()/-]{6,32}$", message = "Broj telefona nije ispravnog oblika.")
        String phone,

        /**
         * Honeypot: polje je u formi skriveno od ljudi. Ako je popunjeno,
         * zahtjev je gotovo sigurno automatiziran.
         *
         * Provjerava se u servisu, a ne Bean Validationom, kako odgovor ne bi
         * imenovao polje — inače bi poruka botu točno rekla što da izostavi.
         */
        String website) {
}
