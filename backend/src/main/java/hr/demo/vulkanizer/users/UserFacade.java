package hr.demo.vulkanizer.users;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.Set;

/**
 * Jedini javni ulaz u `users` modul. Entiteti, repozitoriji i hash lozinke
 * ostaju package-private.
 */
public interface UserFacade {

    /**
     * Registrira novog korisnika. Uloga je UVIJEK CUSTOMER — ne prima se izvana,
     * pa je eskalacija ovlasti kroz request body nemoguća po konstrukciji.
     */
    UserView registerCustomer(String email, String rawPassword, String fullName, String phone);

    /** Kreira korisnika s eksplicitnim ulogama. Poziva samo `admin` modul. */
    UserView createUser(String email, String rawPassword, String fullName, String phone, Set<RoleName> roles);

    Optional<UserCredentials> findCredentialsByEmail(String email);

    UserView getById(Long id);

    Optional<UserView> findById(Long id);

    Page<UserView> search(String query, Pageable pageable);

    UserView updateProfile(Long userId, String fullName, String phone);

    UserView replaceRoles(Long userId, Set<RoleName> roles);

    UserView setActive(Long userId, boolean active);

    void changePassword(Long userId, String currentPassword, String newPassword);

    long countByRole(RoleName role);
}
