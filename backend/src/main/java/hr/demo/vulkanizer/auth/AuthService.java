package hr.demo.vulkanizer.auth;

import hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException;
import hr.demo.vulkanizer.users.UserCredentials;
import hr.demo.vulkanizer.users.UserFacade;
import hr.demo.vulkanizer.users.UserView;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
class AuthService {

    private final UserFacade users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginRateLimiter rateLimiter;

    /**
     * Lažni hash protiv mjerenja vremena: kad korisnik ne postoji, ipak se
     * odradi jedna BCrypt provjera, pa trajanje odgovora ne odaje postoji li
     * e-mail u bazi.
     */
    private final String dummyHash;

    AuthService(UserFacade users, PasswordEncoder passwordEncoder, JwtService jwtService, LoginRateLimiter rateLimiter) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.rateLimiter = rateLimiter;
        this.dummyHash = passwordEncoder.encode("nepostojeca-lozinka-za-izjednacavanje-vremena");
    }

    AppPrincipal login(String email, String rawPassword, String clientIp) {
        if (!rateLimiter.tryConsume(clientIp, email)) {
            throw new BusinessRuleException("Previše pokušaja prijave. Pokušajte ponovno za nekoliko minuta.");
        }

        Optional<UserCredentials> found = users.findCredentialsByEmail(email);
        String hash = found.map(UserCredentials::passwordHash).orElse(dummyHash);
        boolean passwordMatches = passwordEncoder.matches(rawPassword, hash);

        if (found.isEmpty() || !passwordMatches) {
            // Ista poruka za nepostojećeg korisnika i za krivu lozinku —
            // inače se kroz formu za prijavu može popisati baza korisnika.
            throw new BadCredentialsException("Neispravan e-mail ili lozinka.");
        }

        UserCredentials credentials = found.get();
        if (!credentials.active()) {
            throw new DisabledException("Korisnički račun nije aktivan.");
        }

        rateLimiter.reset(clientIp, email);
        return new AppPrincipal(credentials.id(), credentials.email(), credentials.fullName(), credentials.roles());
    }

    AppPrincipal register(String email, String password, String fullName, String phone) {
        UserView created = users.registerCustomer(email, password, fullName, phone);
        return new AppPrincipal(created.id(), created.email(), created.fullName(), created.roles());
    }

    String issueToken(AppPrincipal principal) {
        return jwtService.issue(principal);
    }

    java.time.Duration tokenTtl() {
        return jwtService.ttl();
    }
}
