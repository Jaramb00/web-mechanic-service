package hr.demo.vulkanizer.admin;

import hr.demo.vulkanizer.users.RoleName;
import jakarta.validation.constraints.NotEmpty;

import java.util.Set;

public record AdminRolesRequest(@NotEmpty(message = "Odaberite barem jednu ulogu.") Set<RoleName> roles) {
}
