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
public record AppProperties(Jwt jwt, Cookie cookie, Cors cors, Booking booking, RateLimit rateLimit) {

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
}
