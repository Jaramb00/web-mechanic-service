package hr.demo.vulkanizer.auth;

import hr.demo.vulkanizer.users.RoleName;

import java.util.Set;

/**
 * Prijavljeni korisnik u sigurnosnom kontekstu.
 *
 * Servisi iz njega uzimaju {@code userId} i njime ograničavaju upite — id iz
 * URL-a ili tijela zahtjeva nikad nije izvor istine o tome tko je pozivatelj.
 */
public record AppPrincipal(Long userId, String email, String fullName, Set<RoleName> roles) {

    public boolean hasRole(RoleName role) {
        return roles.contains(role);
    }

    public boolean isStaff() {
        return hasRole(RoleName.ADMIN) || hasRole(RoleName.EMPLOYEE) || hasRole(RoleName.WAREHOUSE_WORKER);
    }
}
