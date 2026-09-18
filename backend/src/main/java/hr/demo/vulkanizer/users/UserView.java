package hr.demo.vulkanizer.users;

import java.time.Instant;
import java.util.Set;

/**
 * Javni prikaz korisnika. Namjerno NE sadrži password hash — hash ne postoji ni
 * kao polje izvan {@code users} paketa, pa ga se ne može slučajno serijalizirati.
 */
public record UserView(
        Long id,
        String email,
        String fullName,
        String phone,
        boolean active,
        Set<RoleName> roles,
        Instant createdAt) {
}
