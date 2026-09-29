package hr.demo.vulkanizer.web;

import hr.demo.vulkanizer.support.AbstractIntegrationTest;
import hr.demo.vulkanizer.users.RoleName;
import hr.demo.vulkanizer.users.UserView;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.http.MediaType.TEXT_PLAIN;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Neispravan ZAHTJEV mora vratiti 4xx, nikad 500.
 *
 * <p>Zašto ovaj test postoji. Bez vlastitog handlera Spring baca iznimke prije
 * nego zahtjev dođe do kontrolera, pa one upadaju u catch-all i postaju 500 —
 * korisnik dobije „Dogodila se neočekivana greška", istu poruku kao kad
 * aplikacija stvarno pukne, a log se napuni stack traceovima koji skrivaju
 * prave kvarove.
 *
 * <p>To nije teorija: {@code NoResourceFoundException} je popravljen zasebno,
 * sestrinski slučajevi su promakli, i svih šest je vraćalo 500 sve dok ih
 * prolaz kroz API nije izvadio na vidjelo. Ovaj test ih drži na okupu.
 */
class ApiErrorMappingTest extends AbstractIntegrationTest {

    private Cookie staff() throws Exception {
        UserView user = fixtures.userWithRoles(Set.of(RoleName.ADMIN));
        return loginAs(user.email());
    }

    @Test
    @DisplayName("Nepostojeća ruta → 404")
    void unknownRouteIsNotFound() throws Exception {
        mockMvc.perform(get("/api/nema-ovoga").cookie(staff())).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Kriva HTTP metoda na postojećoj ruti → 405")
    void wrongMethodIsMethodNotAllowed() throws Exception {
        // /api/appointments postoji, ali samo kao POST.
        mockMvc.perform(get("/api/appointments").cookie(staff()))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("Nepodržan Content-Type → 415")
    void wrongContentTypeIsUnsupportedMediaType() throws Exception {
        mockMvc.perform(post("/api/appointments").with(csrf()).cookie(staff())
                        .contentType(TEXT_PLAIN).content("nije json"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    @DisplayName("Krivi tip u putanji → 400")
    void wrongPathTypeIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/me/vehicles/{id}", "abc").cookie(staff()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Neispravan datum u filtru → 400")
    void unparsableDateIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/work/appointments").param("from", "nijedatum").cookie(staff()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Nepoznata vrijednost enuma u filtru → 400")
    void unknownEnumIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/work/appointments").param("status", "IZMISLJEN").cookie(staff()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Paginacija izvan dopuštenog raspona → 400")
    void invalidPaginationIsBadRequest() throws Exception {
        Cookie session = staff();
        mockMvc.perform(get("/api/work/appointments").param("page", "-5").cookie(session))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/work/appointments").param("size", "99999").cookie(session))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Neispravan JSON u tijelu → 400")
    void malformedJsonIsBadRequest() throws Exception {
        mockMvc.perform(post("/api/appointments").with(csrf()).cookie(staff())
                        .contentType(APPLICATION_JSON).content("{ovo nije json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Previše pokušaja prijave → 429, ne 422")
    void rateLimitIsTooManyRequests() throws Exception {
        // Vlastita adresa: brojač je po IP-u i e-mailu, pa ovaj test ne dira druge.
        String email = "rate-" + UUID.randomUUID() + "@test.local";
        String body = json(Map.of("email", email, "password", "NamjernoKriva1"));

        int status = 0;
        for (int attempt = 0; attempt < 15 && status != 429; attempt += 1) {
            status = mockMvc.perform(post("/api/auth/login").with(csrf())
                            .contentType(APPLICATION_JSON).content(body))
                    .andReturn().getResponse().getStatus();
        }
        org.assertj.core.api.Assertions.assertThat(status)
                .as("nakon niza promašenih prijava mora doći 429 Too Many Requests")
                .isEqualTo(429);
    }

    @Test
    @DisplayName("Ispravan zahtjev i dalje prolazi")
    void validRequestStillWorks() throws Exception {
        mockMvc.perform(get("/api/work/appointments").param("page", "0").param("size", "20")
                        .cookie(staff()))
                .andExpect(status().isOk());
    }
}
