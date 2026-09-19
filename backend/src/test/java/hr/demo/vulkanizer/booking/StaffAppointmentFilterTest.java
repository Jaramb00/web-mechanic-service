package hr.demo.vulkanizer.booking;

import hr.demo.vulkanizer.appointments.AppointmentBookingService;
import hr.demo.vulkanizer.appointments.AppointmentQueryService;
import hr.demo.vulkanizer.appointments.AppointmentStatus;
import hr.demo.vulkanizer.appointments.dto.AppointmentCreateRequest;
import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.support.AbstractIntegrationTest;
import hr.demo.vulkanizer.users.UserView;
import hr.demo.vulkanizer.vehicles.VehicleView;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pregled termina u backofficeu ima tri neobavezna filtra, pa svaka kombinacija
 * zadanih i praznih filtara mora proći do baze.
 *
 * <p>Regresija: upit je bio pisan kao {@code (:param IS NULL OR stupac = :param)}.
 * Hibernate imenovani parametar veže dvaput, kao dva zasebna upitnika, pa
 * samostalni {@code ? IS NULL} ostane bez tipskog konteksta i PostgreSQL odbije
 * pripremiti izjavu ("could not determine data type of parameter"). Stranica
 * "Termini" rušila se na 500 pri svakom otvaranju — i s filtrom i bez njega.
 *
 * <p>Test je smislen samo protiv pravog PostgreSQL-a: H2 bi ovakav upit progutao.
 */
class StaffAppointmentFilterTest extends AbstractIntegrationTest {

    private static final ZoneId ZONE = ZoneId.of("Europe/Zagreb");

    @Autowired
    private AppointmentQueryService query;

    @Autowired
    private AppointmentBookingService booking;

    private final Pageable firstPage = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "startAt"));

    @Test
    @DisplayName("Svaka kombinacija praznih i zadanih filtara prolazi do baze")
    void everyFilterCombinationRuns() {
        AppointmentView created = bookOne();
        LocalDate day = LocalDate.ofInstant(created.startAt(), ZONE);

        // Bez ijednog filtra — sva tri parametra su prazna.
        assertThat(query.listForStaff(null, null, null, firstPage).getTotalElements()).isPositive();

        // Svaki filtar zasebno.
        assertThat(ids(query.listForStaff(AppointmentStatus.PENDING, null, null, firstPage))).contains(created.id());
        assertThat(ids(query.listForStaff(null, day, null, firstPage))).contains(created.id());
        assertThat(ids(query.listForStaff(null, null, day, firstPage))).contains(created.id());

        // Svi zajedno.
        assertThat(ids(query.listForStaff(AppointmentStatus.PENDING, day, day, firstPage))).contains(created.id());
    }

    @Test
    @DisplayName("Filtri stvarno sužavaju rezultat, ne samo da ne pucaju")
    void filtersActuallyNarrowResults() {
        AppointmentView created = bookOne();
        LocalDate day = LocalDate.ofInstant(created.startAt(), ZONE);

        // Termin je PENDING, pa ga filtar po drugom statusu ne smije vratiti.
        assertThat(ids(query.listForStaff(AppointmentStatus.COMPLETED, null, null, firstPage)))
                .doesNotContain(created.id());

        // Isto vrijedi za razdoblje koje ne obuhvaća njegov dan.
        assertThat(ids(query.listForStaff(null, day.plusDays(1), null, firstPage)))
                .doesNotContain(created.id());
        assertThat(ids(query.listForStaff(null, null, day.minusDays(1), firstPage)))
                .doesNotContain(created.id());
    }

    private AppointmentView bookOne() {
        UserView customer = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(customer);
        Instant start = fixtures.futureSlot(45, LocalTime.of(9, 0));
        return booking.book(customer.id(), new AppointmentCreateRequest(
                fixtures.service("Test usluga 30").id(), vehicle.id(), start, null, null));
    }

    private static java.util.List<Long> ids(Page<AppointmentView> page) {
        return page.getContent().stream().map(AppointmentView::id).toList();
    }
}
