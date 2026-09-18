package hr.demo.vulkanizer.users;

import hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException;
import hr.demo.vulkanizer.common.error.DomainExceptions.ConflictException;
import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Optional;
import java.util.Set;

@Service
class UserFacadeImpl implements UserFacade {

    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;

    UserFacadeImpl(UserRepository users, RoleRepository roles, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.roles = roles;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public UserView registerCustomer(String email, String rawPassword, String fullName, String phone) {
        return createUser(email, rawPassword, fullName, phone, Set.of(RoleName.CUSTOMER));
    }

    @Override
    @Transactional
    public UserView createUser(String email, String rawPassword, String fullName, String phone, Set<RoleName> roleNames) {
        String normalized = normalizeEmail(email);
        if (users.existsByEmailIgnoreCase(normalized)) {
            throw new ConflictException("Korisnik s tom e-mail adresom već postoji.");
        }
        User user = new User(normalized, passwordEncoder.encode(rawPassword), fullName.trim(), trimToNull(phone));
        resolveRoles(roleNames).forEach(user::addRole);
        return toView(users.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserCredentials> findCredentialsByEmail(String email) {
        return users.findByEmailIgnoreCase(normalizeEmail(email))
                .map(u -> new UserCredentials(u.getId(), u.getEmail(), u.getFullName(),
                        u.getPasswordHash(), u.isActive(), u.roleNames()));
    }

    @Override
    @Transactional(readOnly = true)
    public UserView getById(Long id) {
        return findById(id).orElseThrow(() -> new NotFoundException("Korisnik nije pronađen."));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserView> findById(Long id) {
        return users.findById(id).map(UserFacadeImpl::toView);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserView> search(String query, Pageable pageable) {
        return users.search(query == null ? "" : query.trim(), pageable).map(UserFacadeImpl::toView);
    }

    @Override
    @Transactional
    public UserView updateProfile(Long userId, String fullName, String phone) {
        User user = require(userId);
        user.updateProfile(fullName.trim(), trimToNull(phone));
        return toView(user);
    }

    @Override
    @Transactional
    public UserView replaceRoles(Long userId, Set<RoleName> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            throw new BusinessRuleException("Korisnik mora imati barem jednu ulogu.");
        }
        User user = require(userId);
        // Zadnji administrator ne smije ostati bez svoje uloge — inače nitko
        // više ne može upravljati sustavom.
        if (user.roleNames().contains(RoleName.ADMIN) && !roleNames.contains(RoleName.ADMIN)
                && countByRole(RoleName.ADMIN) <= 1) {
            throw new BusinessRuleException("Sustav mora imati barem jednog administratora.");
        }
        user.replaceRoles(resolveRoles(roleNames));
        return toView(user);
    }

    @Override
    @Transactional
    public UserView setActive(Long userId, boolean active) {
        User user = require(userId);
        if (!active && user.roleNames().contains(RoleName.ADMIN) && countByRole(RoleName.ADMIN) <= 1) {
            throw new BusinessRuleException("Sustav mora imati barem jednog aktivnog administratora.");
        }
        user.setActive(active);
        return toView(user);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = require(userId);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BusinessRuleException("Trenutna lozinka nije ispravna.");
        }
        user.changePasswordHash(passwordEncoder.encode(newPassword));
    }

    @Override
    @Transactional(readOnly = true)
    public long countByRole(RoleName role) {
        return users.countActiveByRole(role);
    }

    private User require(Long id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("Korisnik nije pronađen."));
    }

    private Set<Role> resolveRoles(Set<RoleName> names) {
        Set<Role> resolved = roles.findByNameIn(names);
        if (resolved.size() != names.size()) {
            throw new BusinessRuleException("Nepoznata uloga u zahtjevu.");
        }
        return resolved;
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    static UserView toView(User u) {
        return new UserView(u.getId(), u.getEmail(), u.getFullName(), u.getPhone(),
                u.isActive(), u.roleNames(), u.getCreatedAt());
    }
}
