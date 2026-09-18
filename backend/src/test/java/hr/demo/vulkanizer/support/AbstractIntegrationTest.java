package hr.demo.vulkanizer.support;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Zajednička osnova integracijskih testova.
 *
 * Testovi rade protiv stvarnog PostgreSQL-a (vidi application-test.yml) jer se
 * ključna jamstva sustava oslanjaju na PostgreSQL: EXCLUDE constraint za
 * termine i uvjetni UPDATE-ovi za zalihu. Na in-memory bazi bi ti testovi
 * prolazili lažno.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected TestDataFactory fixtures;

    protected String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    /**
     * Prijavljuje se stvarnim tokom (POST /api/auth/login) i vraća cookie sa
     * tokenom. Testovi time provjeravaju i sam mehanizam prijave, umjesto da ga
     * zaobiđu lažnim principalom.
     */
    protected Cookie loginAs(String email) throws Exception {
        var response = mockMvc.perform(post("/api/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", TestDataFactory.PASSWORD))))
                .andExpect(status().isOk())
                .andReturn().getResponse();

        Cookie cookie = response.getCookie("vulkanizer_token");
        if (cookie == null) {
            throw new IllegalStateException("Prijava nije vratila cookie s tokenom.");
        }
        return cookie;
    }
}
