package hr.demo.vulkanizer.users;

import hr.demo.vulkanizer.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class User extends BaseEntity {

    @Column(nullable = false)
    private String email;

    /** Nikad ne izlazi iz ovog paketa. Nema gettera u nijednom DTO-u. */
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 160)
    private String fullName;

    @Column(length = 32)
    private String phone;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    User(String email, String passwordHash, String fullName, String phone) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.phone = phone;
        this.active = true;
    }

    void addRole(Role role) {
        roles.add(role);
    }

    void replaceRoles(Set<Role> newRoles) {
        roles.clear();
        roles.addAll(newRoles);
    }

    void updateProfile(String fullName, String phone) {
        this.fullName = fullName;
        this.phone = phone;
    }

    void changePasswordHash(String newHash) {
        this.passwordHash = newHash;
    }

    void setActive(boolean active) {
        this.active = active;
    }

    Set<RoleName> roleNames() {
        return roles.stream().map(Role::getName).collect(java.util.stream.Collectors.toSet());
    }
}
