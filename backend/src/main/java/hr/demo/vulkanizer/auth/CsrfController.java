package hr.demo.vulkanizer.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Autentikacija")
@RestController
@RequestMapping("/api/auth")
class CsrfController {

    /**
     * Frontend ovo zove jednom pri pokretanju. Sam pristup tokenu natjera
     * Spring Security da postavi XSRF-TOKEN cookie (token se inače učitava
     * odgođeno), koji se potom šalje natrag u X-XSRF-TOKEN zaglavlju.
     */
    @Operation(summary = "Inicijalizira CSRF token za sesiju preglednika")
    @GetMapping("/csrf")
    CsrfTokenResponse csrf(CsrfToken token) {
        return new CsrfTokenResponse(token.getHeaderName(), token.getToken());
    }

    record CsrfTokenResponse(String headerName, String token) {
    }
}
