package hr.demo.vulkanizer.auth;

import hr.demo.vulkanizer.auth.dto.AuthUserResponse;
import hr.demo.vulkanizer.auth.dto.ChangePasswordRequest;
import hr.demo.vulkanizer.auth.dto.LoginRequest;
import hr.demo.vulkanizer.auth.dto.RegisterRequest;
import hr.demo.vulkanizer.auth.dto.UpdateProfileRequest;
import hr.demo.vulkanizer.common.web.HoneypotGuard;
import hr.demo.vulkanizer.users.UserFacade;
import hr.demo.vulkanizer.users.UserView;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.util.StringUtils;

@Tag(name = "Autentikacija")
@RestController
@RequestMapping("/api/auth")
class AuthController {

    private final AuthService authService;
    private final AuthCookieFactory cookies;
    private final UserFacade users;

    AuthController(AuthService authService, AuthCookieFactory cookies, UserFacade users) {
        this.authService = authService;
        this.cookies = cookies;
        this.users = users;
    }

    @Operation(summary = "Prijava — token se vraća u HttpOnly cookieju, ne u tijelu odgovora")
    @PostMapping("/login")
    ResponseEntity<AuthUserResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        AppPrincipal principal = authService.login(request.email(), request.password(), clientIp(http));
        return withAuthCookie(principal, HttpStatus.OK);
    }

    @Operation(summary = "Registracija korisnika (uvijek uloga CUSTOMER)")
    @PostMapping("/register")
    ResponseEntity<AuthUserResponse> register(@Valid @RequestBody RegisterRequest request) {
        HoneypotGuard.check(request.website());
        AppPrincipal principal = authService.register(
                request.email(), request.password(), request.fullName(), request.phone());
        return withAuthCookie(principal, HttpStatus.CREATED);
    }

    @Operation(summary = "Odjava — briše cookie s tokenom")
    @PostMapping("/logout")
    ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookies.expired().toString())
                .build();
    }

    @Operation(summary = "Podaci o prijavljenom korisniku")
    @GetMapping("/me")
    AuthUserResponse me(@AuthenticationPrincipal AppPrincipal principal) {
        UserView user = users.getById(principal.userId());
        return new AuthUserResponse(user.id(), user.email(), user.fullName(), user.roles());
    }

    @Operation(summary = "Izmjena vlastitog profila")
    @PutMapping("/me")
    AuthUserResponse updateProfile(@AuthenticationPrincipal AppPrincipal principal,
                                   @Valid @RequestBody UpdateProfileRequest request) {
        UserView user = users.updateProfile(principal.userId(), request.fullName(), request.phone());
        return new AuthUserResponse(user.id(), user.email(), user.fullName(), user.roles());
    }

    @Operation(summary = "Izmjena vlastite lozinke")
    @PutMapping("/me/password")
    ResponseEntity<Void> changePassword(@AuthenticationPrincipal AppPrincipal principal,
                                        @Valid @RequestBody ChangePasswordRequest request) {
        users.changePassword(principal.userId(), request.currentPassword(), request.newPassword());
        // Lozinka je promijenjena — postojeći token se odbacuje i traži se nova prijava.
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookies.expired().toString())
                .build();
    }

    private ResponseEntity<AuthUserResponse> withAuthCookie(AppPrincipal principal, HttpStatus status) {
        ResponseCookie cookie = cookies.create(authService.issueToken(principal), authService.tokenTtl());
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthUserResponse(principal.userId(), principal.email(),
                        principal.fullName(), principal.roles()));
    }

    /**
     * Iza reverse proxyja stvarna adresa dolazi u X-Forwarded-For.
     * DEMO: vjeruje se prvom zapisu. U produkciji proxy mora biti konfiguriran
     * da to zaglavlje prepisuje, inače ga klijent može lažirati.
     */
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
