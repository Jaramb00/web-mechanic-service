package hr.demo.vulkanizer.booking;

import hr.demo.vulkanizer.appointments.AppointmentBookingService;
import hr.demo.vulkanizer.appointments.AppointmentStatus;
import hr.demo.vulkanizer.appointments.AppointmentWorkService;
import hr.demo.vulkanizer.appointments.dto.AppointmentCreateRequest;
import hr.demo.vulkanizer.appointments.dto.AppointmentItemRequest;
import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.support.AbstractIntegrationTest;
import hr.demo.vulkanizer.users.RoleName;
import hr.demo.vulkanizer.users.UserView;
import hr.demo.vulkanizer.vehicles.VehicleView;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pregled termina u administraciji, kroz HTTP.
 *
 * <p><b>Zašto postoji uz StaffAppointmentFilterTest.</b> Onaj test zove
 * {@code AppointmentQueryService} izravno i dokazuje da upit radi. Stranica
 * „Termini" se ipak rušila na 500 — dvaput, i drugi put nakon što je regresijski
 * test već bio napisan. Test koji pokriva pad korisničkog ekrana, a ne dira put
 * kojim taj ekran ide, ne dokazuje da je ekran živ.
 *
 * <p>Ovaj ide cijelim putem: prijava, kolačić, {@code @PreAuthorize}, vezanje
 * neobaveznih parametara, upit i serijalizacija odgovora. Provjerava se i
 * tijelo, ne samo status — 200 s neispravnim JSON-om jednako je slomljen ekran.
 *
 * <p>Podaci su namjerno oblikovani kao demo seed, a ne kao čist test: termin u
 * prošlosti, završen termin sa stavkama, otkazani termin i budući termin. Čisti
 * podaci su i bili razlog zašto je prvi test prolazio.
 */
class StaffAppointmentEndpointTest extends AbstractIntegrationTest {

    private static final ZoneId ZONE = ZoneId.of("Europe/Zagreb");
    private static final String ENDPOINT = "/api/work/appointments";

    /**
     * Baza se između testova ne čisti (vidi TestDataFactory), a @BeforeEach se
     * izvodi za svaki test. Bez pomaka bi drugi prolaz tražio isti termin na
     * istom radnom mjestu i pao na EXCLUDE constraintu — što je constraint koji
     * radi svoj posao, ne kvar.
     */
    private static final AtomicInteger RUN = new AtomicInteger();

    @Autowired
    private AppointmentBookingService booking;

    @Autowired
    private AppointmentWorkService work;

    @Autowired
    private JdbcTemplate jdbc;

    private Cookie admin;

    @BeforeEach
    void prepare() throws Exception {
        UserView staff = fixtures.userWithRoles(Set.of(RoleName.ADMIN));
        admin = loginAs(staff.email());
        seedDemoShapedData(staff.id());
    }

    @Test
    @DisplayName("Otvaranje stranice bez ijednog filtra vraća 200 i popunjenu listu")
    void listWithoutFiltersReturnsData() throws Exception {
        mockMvc.perform(get(ENDPOINT).param("page", "0").param("size", "20").cookie(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber())
                // Serijalizacija stvarno prođe do zadnjeg polja retka.
                .andExpect(jsonPath("$.content[0].status").isNotEmpty())
                .andExpect(jsonPath("$.content[0].startAt").isNotEmpty())
                .andExpect(jsonPath("$.content[0].itemsTotal").isNotEmpty());
    }

    @Test
    @DisplayName("Svaki neobavezan filtar, zasebno i zajedno, vraća 200")
    void everyFilterCombinationReturnsOk() throws Exception {
        String today = LocalDate.now(ZONE).toString();
        String nextMonth = LocalDate.now(ZONE).plusMonths(2).toString();

        mockMvc.perform(get(ENDPOINT).param("status", "PENDING").cookie(admin))
                .andExpect(status().isOk());
        mockMvc.perform(get(ENDPOINT).param("from", today).cookie(admin))
                .andExpect(status().isOk());
        mockMvc.perform(get(ENDPOINT).param("to", nextMonth).cookie(admin))
                .andExpect(status().isOk());
        mockMvc.perform(get(ENDPOINT)
                        .param("status", "COMPLETED").param("from", "2020-01-01").param("to", nextMonth)
                        .cookie(admin))
                .andExpect(status().isOk());

        // Druga stranica: paginacija je dio istog puta i jednako puca.
        mockMvc.perform(get(ENDPOINT).param("page", "1").param("size", "5").cookie(admin))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Bez prijave nema pregleda — 401, ne 500")
    void anonymousIsRejected() throws Exception {
        mockMvc.perform(get(ENDPOINT))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Stanje kakvo administrator zatekne u demou: nekoliko završenih termina iza
     * sebe, poneki otkazani i nekoliko budućih. Termin u prošlosti se upisuje
     * izravno jer ga booking servis — ispravno — odbija primiti.
     */
    private void seedDemoShapedData(Long actorId) {
        UserView customer = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(customer);
        Long serviceId = fixtures.service("Test usluga 30").id();
        int run = RUN.getAndIncrement();
        // Dani i sati koje ne dira nijedan drugi test: BookingConcurrencyTest
        // popunjava SVA radna mjesta na dan 45 u 8:00, ostali rade prijepodne.
        // Horizont rezervacije je 60 dana, pa pomak ide prema dolje.
        int day = 36 + run * 3;

        // Budući termin, ostaje PENDING.
        booking.book(customer.id(), new AppointmentCreateRequest(
                serviceId, vehicle.id(), fixtures.futureSlot(day, LocalTime.of(13, 0)), "Napomena kupca", null));

        // Završen termin sa stavkom — prolazi cijeli životni ciklus.
        AppointmentView completed = booking.book(customer.id(), new AppointmentCreateRequest(
                serviceId, vehicle.id(), fixtures.futureSlot(day, LocalTime.of(14, 30)), null, null));
        work.changeStatus(completed.id(), AppointmentStatus.CONFIRMED);
        work.changeStatus(completed.id(), AppointmentStatus.IN_PROGRESS);
        work.changeStatus(completed.id(), AppointmentStatus.COMPLETED);
        work.addItem(completed.id(), new AppointmentItemRequest(null, serviceId, 2), actorId);
        work.setMechanicNote(completed.id(), "Zamijenjen ventil.");

        // Otkazani termin.
        AppointmentView cancelled = booking.book(customer.id(), new AppointmentCreateRequest(
                serviceId, vehicle.id(), fixtures.futureSlot(day, LocalTime.of(16, 0)), null, null));
        work.changeStatus(cancelled.id(), AppointmentStatus.CANCELLED);

        // Termin u prošlosti — booking ga ne bi primio, a u demou ih ima.
        Instant past = Instant.now().minus(40, ChronoUnit.DAYS).plus(run * 2L, ChronoUnit.HOURS);
        Long bayId = jdbc.queryForObject("SELECT id FROM service_bays ORDER BY id LIMIT 1", Long.class);
        jdbc.update("""
                INSERT INTO appointments (customer_id, vehicle_id, service_id, bay_id, start_at, end_at, status)
                VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED')
                """, customer.id(), vehicle.id(), serviceId, bayId,
                Timestamp.from(past), Timestamp.from(past.plus(30, ChronoUnit.MINUTES)));
    }
}
