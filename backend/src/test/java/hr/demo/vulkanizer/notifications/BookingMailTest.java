package hr.demo.vulkanizer.notifications;

import hr.demo.vulkanizer.appointments.AppointmentBookingService;
import hr.demo.vulkanizer.appointments.dto.AppointmentCreateRequest;
import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.common.error.DomainExceptions.SlotUnavailableException;
import hr.demo.vulkanizer.support.AbstractIntegrationTest;
import hr.demo.vulkanizer.users.UserView;
import hr.demo.vulkanizer.vehicles.VehicleView;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalTime;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Dojava servisu o novoj rezervaciji.
 *
 * Tri tvrdnje, svaka pokriva jedan način na koji se ovo u praksi pokvari:
 * poruka se ne sastavi kako treba, poruka ode za termin koji nije spremljen,
 * ili pad pošiljatelja obori rezervaciju koja je uspjela.
 */
@Import(BookingMailTest.RecordingMailConfig.class)
class BookingMailTest extends AbstractIntegrationTest {

    /*
     * Testovi se razlikuju po SATU, ne samo po danu: fixtures.futureSlot vikend
     * preskače pomicanjem datuma, pa dani 51, 52 i 53 mogu pasti na isti
     * ponedjeljak. Dva radna mjesta znače da bi se testovi tada rušili međusobno.
     */

    @TestConfiguration
    static class RecordingMailConfig {
        @Bean
        @Primary
        RecordingMailSender recordingMailSender() {
            return new RecordingMailSender();
        }
    }

    @Autowired
    private AppointmentBookingService booking;

    @Autowired
    private RecordingMailSender mail;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void clearMailbox() {
        mail.reset();
    }

    @Test
    @DisplayName("Rezervacija pošalje servisu dojavu sa svime što treba za poziv kupcu")
    void bookingSendsShopNotification() {
        UserView customer = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(customer);
        Instant start = fixtures.futureSlot(51, LocalTime.of(8, 0));

        booking.book(customer.id(), new AppointmentCreateRequest(
                fixtures.service("Test usluga 60").id(), vehicle.id(), start,
                "Prednja lijeva guma gubi zrak.", null));

        assertThat(mail.sent()).hasSize(1);
        MailMessage message = mail.sent().getFirst();

        // Primatelj dolazi iz konfiguracije (application-test.yml), ne iz koda.
        assertThat(message.to()).isEqualTo("vlasnik@test.local");
        assertThat(message.subject()).startsWith("Nova rezervacija");
        assertThat(message.body())
                .contains("Test usluga 60")
                .contains(customer.fullName())
                .contains(customer.email())
                .contains(vehicle.registration())
                .contains("Prednja lijeva guma gubi zrak.");
    }

    @Test
    @DisplayName("Rezervacija koja nije prošla ne šalje dojavu")
    void rejectedBookingSendsNothing() {
        Long serviceId = fixtures.service("Test usluga 30").id();
        Instant start = fixtures.futureSlot(52, LocalTime.of(9, 30));

        // Popuni sva radna mjesta u tom terminu, pa isprazni sandučić.
        int bays = jdbc.queryForObject("SELECT count(*) FROM service_bays", Integer.class);
        for (int i = 0; i < bays; i++) {
            UserView customer = fixtures.customer();
            booking.book(customer.id(), new AppointmentCreateRequest(
                    serviceId, fixtures.vehicleFor(customer).id(), start, null, null));
        }
        assertThat(mail.sent()).hasSize(bays);
        mail.reset();

        UserView unlucky = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(unlucky);
        assertThatThrownBy(() -> booking.book(unlucky.id(), new AppointmentCreateRequest(
                serviceId, vehicle.id(), start, null, null)))
                .isInstanceOf(SlotUnavailableException.class);

        // Događaj se objavljuje unutar transakcije koja je pala na EXCLUDE
        // constraintu. Da slušatelj ne visi o commitu, ovdje bi stajala poruka
        // o terminu koji ne postoji.
        assertThat(mail.sent()).isEmpty();
    }

    @Test
    @DisplayName("Pad pošiljatelja ne ruši rezervaciju koja je već spremljena")
    void failingMailDoesNotBreakBooking() {
        UserView customer = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(customer);
        Instant start = fixtures.futureSlot(53, LocalTime.of(11, 0));
        mail.failOnNextSend();

        AppointmentView[] booked = new AppointmentView[1];
        assertThatCode(() -> booked[0] = booking.book(customer.id(), new AppointmentCreateRequest(
                fixtures.service("Test usluga 30").id(), vehicle.id(), start, null, null)))
                .doesNotThrowAnyException();

        assertThat(booked[0]).isNotNull();
        List<Long> rows = jdbc.queryForList(
                "SELECT id FROM appointments WHERE id = ?", Long.class, booked[0].id());
        assertThat(rows).hasSize(1);

        // I obavijest u aplikaciji mora preživjeti: dva slušatelja su odvojena
        // baš zato da pad jednoga ne odnese drugoga.
        Integer notifications = jdbc.queryForObject(
                "SELECT count(*) FROM notifications WHERE user_id = ? AND type = 'APPOINTMENT_BOOKED'",
                Integer.class, customer.id());
        assertThat(notifications).isEqualTo(1);
    }
}
