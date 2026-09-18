package hr.demo.vulkanizer.auth.dto;

import hr.demo.vulkanizer.users.RoleName;

import java.util.Set;

/** Ono što frontend treba znati o prijavljenom korisniku — i ništa više. */
public record AuthUserResponse(Long id, String email, String fullName, Set<RoleName> roles) {
}
