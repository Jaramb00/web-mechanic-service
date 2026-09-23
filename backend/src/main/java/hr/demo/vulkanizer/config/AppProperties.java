package hr.demo.vulkanizer.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.ZoneId;
import java.util.List;

/**
 * Sva podesiva ponašanja na jednom mjestu. Tajne dolaze iz okoline — ništa
 * osjetljivo nema hardkodiranu vrijednost u kodu.
 */
@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cookie cookie, Cors cors, Booking booking, RateLimit rateLimit, Mail mail) {

    public record Jwt(
            /* HS256 traži barem 256 bita ključa; kraći ključ znači slabiji potpis. */
            @NotBlank @Size(min = 32, message = "JWT_SECRET mora imati barem 32 znaka") String secret,
            @Min(5) int expirationMinutes) {
    }

    public record Cookie(@NotBlank String name, boolean secure, @NotBlank String sameSite) {
    }

    public record Cors(@NotEmpty List<String> allowedOrigins) {
    }

    public record Booking(
            @Min(10) int slotMinutes,
            @Min(1) int horizonDays,
            @Min(0) int cancelCutoffHours,
            @NotBlank String timezone) {

        public ZoneId zone() {
            return ZoneId.of(timezone);
        }
    }

    public record RateLimit(@Min(1) int loginAttempts, @Min(1) int loginWindowMinutes) {
    }

    /**
     * Odlazni e-mail. Polja namjerno NEMAJU @NotBlank: kad je {@code enabled=false}
     * (demo i testovi) ništa se ne šalje, pa prazne vrijednosti nisu greška.
     * Kad je uključen, potpunost provjerava SmtpMailSender pri pokretanju — bolje
     * da se aplikacija ne digne nego da tiho ne šalje.
     */
    public record Mail(boolean enabled, String from, String shopRecipient, String portalUrl) {
    }
}
