package hr.demo.vulkanizer.auth;

import hr.demo.vulkanizer.config.AppProperties;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Cookie s tokenom je HttpOnly — JavaScript ga ne može pročitati, pa XSS ne može
 * ukrasti sesiju. SameSite=Lax uz CSRF token pokriva cross-site zahtjeve.
 * Secure je uključen u produkcijskom profilu (vidi application-prod.yml).
 */
@Component
public class AuthCookieFactory {

    private final AppProperties.Cookie config;

    AuthCookieFactory(AppProperties properties) {
        this.config = properties.cookie();
    }

    public String cookieName() {
        return config.name();
    }

    ResponseCookie create(String token, Duration maxAge) {
        return base(token).maxAge(maxAge).build();
    }

    ResponseCookie expired() {
        return base("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(config.name(), value)
                .httpOnly(true)
                .secure(config.secure())
                .sameSite(config.sameSite())
                .path("/");
    }
}
