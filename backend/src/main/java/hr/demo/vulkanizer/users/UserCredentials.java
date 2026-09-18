package hr.demo.vulkanizer.users;

import java.util.Set;

/**
 * Podaci potrebni isključivo za provjeru prijave. Vraća se samo `auth` modulu i
 * nikad ne završi u HTTP odgovoru.
 */
public record UserCredentials(Long id, String email, String fullName, String passwordHash,
                              boolean active, Set<RoleName> roles) {
}
