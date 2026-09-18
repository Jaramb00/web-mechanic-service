package hr.demo.vulkanizer.security;

import hr.demo.vulkanizer.support.AbstractIntegrationTest;
import hr.demo.vulkanizer.support.TestDataFactory;
import hr.demo.vulkanizer.users.UserView;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthenticationFlowTest extends AbstractIntegrationTest {

    @Test
    @DisplayName("Prijava ispravnim podacima vraća korisnika i postavlja HttpOnly cookie")
    void loginSetsHttpOnlyCookie() throws Exception {
        UserView user = fixtures.customer();

        var result = mockMvc.perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content(json(Map.of("email", user.email(), "password", TestDataFactory.PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(user.email()))
                .andReturn();

        // Token NE smije biti u tijelu odgovora — inače bi ga JavaScript vidio.
        assertThat(result.getResponse().getContentAsString()).doesNotContain("eyJ");

        var cookie = result.getResponse().getCookie("vulkanizer_token");
        assertThat(cookie).isNotNull();
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.getAttribute("SameSite")).isEqualTo("Lax");
    }

    @Test
    @DisplayName("Odgovor na prijavu nikad ne sadrži hash lozinke")
    void loginResponseHasNoPasswordHash() throws Exception {
        UserView user = fixtures.customer();

        var body = mockMvc.perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content(json(Map.of("email", user.email(), "password", TestDataFactory.PASSWORD))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(body).doesNotContain("password").doesNotContain("$2a$");
    }

    @Test
    @DisplayName("Kriva lozinka i nepostojeći korisnik daju identičan odgovor")
    void wrongCredentialsAreIndistinguishable() throws Exception {
        UserView user = fixtures.customer();

        String wrongPassword = mockMvc.perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content(json(Map.of("email", user.email(), "password", "NetocnaLozinka1"))))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        String unknownUser = mockMvc.perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content(json(Map.of("email", fixtures.uniqueEmail("nepostoji"), "password", "NetocnaLozinka1"))))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        // Različit odgovor bi omogućio popisivanje postojećih e-mail adresa.
        assertThat(wrongPassword).isEqualTo(unknownUser);
    }

    @Test
    @DisplayName("Registracija ignorira podmetnutu ulogu i uvijek kreira CUSTOMER-a")
    void registrationCannotEscalateRole() throws Exception {
        String email = fixtures.uniqueEmail("napadac");

        // Nepoznato polje `role` ruši deserijalizaciju (fail-on-unknown-properties).
        mockMvc.perform(post("/api/auth/register").with(csrf())
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","password":"Lozinka123","fullName":"Napadač Test",
                                 "phone":"","website":"","role":"ADMIN"}
                                """.formatted(email)))
                .andExpect(status().isBadRequest());

        // Ista registracija bez podmetnutog polja prolazi — i dobiva CUSTOMER.
        mockMvc.perform(post("/api/auth/register").with(csrf())
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","password":"Lozinka123","fullName":"Napadač Test",
                                 "phone":"","website":""}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roles").isArray())
                .andExpect(jsonPath("$.roles[0]").value("CUSTOMER"));
    }

    @Test
    @DisplayName("Popunjeno honeypot polje odbija registraciju bez otkrivanja koje je polje")
    void honeypotRejectsBots() throws Exception {
        String body = mockMvc.perform(post("/api/auth/register").with(csrf())
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","password":"Lozinka123","fullName":"Bot Test",
                                 "phone":"","website":"http://spam.example"}
                                """.formatted(fixtures.uniqueEmail("bot"))))
                .andExpect(status().isUnprocessableEntity())
                .andReturn().getResponse().getContentAsString();

        assertThat(body).doesNotContain("website");
    }

    @Test
    @DisplayName("Mutirajući zahtjev bez CSRF tokena se odbija")
    void missingCsrfTokenIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(json(Map.of("email", "bilo@tko.hr", "password", "bilostoto"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Ponavljani neuspjeli pokušaji prijave aktiviraju ograničenje")
    void loginIsRateLimited() throws Exception {
        UserView user = fixtures.customer();
        String payload = json(Map.of("email", user.email(), "password", "SasvimKrivo1"));

        boolean throttled = false;
        // Prag je 5 pokušaja u testnom profilu; ide se malo preko njega.
        for (int i = 0; i < 8; i++) {
            int statusCode = mockMvc.perform(post("/api/auth/login").with(csrf())
                            .contentType("application/json").content(payload))
                    .andReturn().getResponse().getStatus();
            if (statusCode == 422) {
                throttled = true;
                break;
            }
        }
        assertThat(throttled)
                .as("nakon niza neuspjelih pokušaja prijava mora biti privremeno blokirana")
                .isTrue();
    }

    @Test
    @DisplayName("Za neprijavljenog posjetitelja /me vraća prazan odgovor, ne grešku")
    void anonymousProfileIsEmptyNotAnError() throws Exception {
        // Odsutnost sesije je činjenica, ne greška: javna stranica poziva ovu
        // rutu pri svakom učitavanju i ne smije pritom proizvoditi 401.
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
    }

    @Test
    @DisplayName("Neprijavljeni korisnik ne može doći do zaštićenih podataka")
    void anonymousCannotReachProtectedData() throws Exception {
        mockMvc.perform(get("/api/me/vehicles")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/me/appointments")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/dashboard")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/warehouse/products")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Javne rute rade bez prijave")
    void publicRoutesAreOpen() throws Exception {
        mockMvc.perform(get("/api/services")).andExpect(status().isOk());
        mockMvc.perform(get("/api/products")).andExpect(status().isOk());
        mockMvc.perform(get("/api/working-hours")).andExpect(status().isOk());
    }
}
