package hr.demo.vulkanizer.auth;

import hr.demo.vulkanizer.config.AppProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Ograničava broj pokušaja prijave po kombinaciji IP adrese i e-maila, kako
 * jedan napadač ne bi mogao nasumično probijati lozinke.
 *
 * DEMO: spremnik je u memoriji jedne instance. Za produkciju iza više instanci
 * ovo mora ići u zajednički spremnik (Redis) — vidi docs/SECURITY.md.
 */
@Component
public class LoginRateLimiter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final int attempts;
    private final Duration window;

    LoginRateLimiter(AppProperties properties) {
        this.attempts = properties.rateLimit().loginAttempts();
        this.window = Duration.ofMinutes(properties.rateLimit().loginWindowMinutes());
    }

    boolean tryConsume(String clientIp, String email) {
        String key = clientIp + "|" + (email == null ? "" : email.toLowerCase());
        return buckets.computeIfAbsent(key, k -> Bucket.builder()
                        .addLimit(Bandwidth.builder().capacity(attempts).refillGreedy(attempts, window).build())
                        .build())
                .tryConsume(1);
    }

    /** Uspješna prijava briše brojač, da legitiman korisnik ne ostane zaključan. */
    void reset(String clientIp, String email) {
        buckets.remove(clientIp + "|" + (email == null ? "" : email.toLowerCase()));
    }
}
