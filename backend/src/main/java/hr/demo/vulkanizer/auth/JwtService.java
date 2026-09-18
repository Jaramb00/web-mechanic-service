package hr.demo.vulkanizer.auth;

import hr.demo.vulkanizer.config.AppProperties;
import hr.demo.vulkanizer.users.RoleName;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/** Izdavanje i provjera JWT-a. Token nosi samo ono što je nužno za autorizaciju. */
@Service
public class JwtService {

    private final SecretKey key;
    private final Duration ttl;

    JwtService(AppProperties properties) {
        this.key = Keys.hmacShaKeyFor(properties.jwt().secret().getBytes(StandardCharsets.UTF_8));
        this.ttl = Duration.ofMinutes(properties.jwt().expirationMinutes());
    }

    String issue(AppPrincipal principal) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(principal.userId()))
                .claim("email", principal.email())
                .claim("name", principal.fullName())
                .claim("roles", principal.roles().stream().map(Enum::name).toList())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .signWith(key)
                .compact();
    }

    Duration ttl() {
        return ttl;
    }

    /**
     * Vraća prazno za svaki nevaljan token — istekao, krivo potpisan ili
     * izmijenjen. Razlog se namjerno ne razlikuje prema klijentu.
     */
    Optional<AppPrincipal> parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            @SuppressWarnings("unchecked")
            List<String> roleNames = claims.get("roles", List.class);
            Set<RoleName> roles = roleNames == null ? Set.of()
                    : roleNames.stream().map(RoleName::valueOf).collect(Collectors.toUnmodifiableSet());
            return Optional.of(new AppPrincipal(
                    Long.valueOf(claims.getSubject()),
                    claims.get("email", String.class),
                    claims.get("name", String.class),
                    roles));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
