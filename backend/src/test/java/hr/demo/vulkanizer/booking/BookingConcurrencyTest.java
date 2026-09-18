package hr.demo.vulkanizer.booking;

import hr.demo.vulkanizer.appointments.AppointmentBookingService;
import hr.demo.vulkanizer.appointments.AvailabilityService;
import hr.demo.vulkanizer.appointments.dto.AppointmentCreateRequest;
import hr.demo.vulkanizer.appointments.dto.DayAvailability;
import hr.demo.vulkanizer.appointments.dto.SlotView;
import hr.demo.vulkanizer.common.error.DomainExceptions.SlotUnavailableException;
import hr.demo.vulkanizer.support.AbstractIntegrationTest;
import hr.demo.vulkanizer.support.TestDataFactory;
import hr.demo.vulkanizer.users.UserView;
import hr.demo.vulkanizer.vehicles.VehicleView;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Najvažniji test bookinga: dvostruka rezervacija ne smije proći ni kad više
 * korisnika istovremeno pokušava isti termin.
 *
 * Testira se kroz stvarne dretve protiv stvarne baze, jer se zaštita oslanja na
 * PostgreSQL EXCLUDE constraint — mock ili in-memory baza ovdje ne dokazuju ništa.
 */
class BookingConcurrencyTest extends AbstractIntegrationTest {

    @Autowired
    private AppointmentBookingService booking;

    @Autowired
    private AvailabilityService availability;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    @DisplayName("Istovremene rezervacije istog termina: prolazi točno onoliko koliko ima radnih mjesta")
    void concurrentBookingsRespectCapacity() throws Exception {
        Long serviceId = fixtures.service("Test usluga 30").id();
        Instant start = fixtures.futureSlot(45, LocalTime.of(8, 0));

        int capacity = freeBaysAt(start, serviceId);
        assertThat(capacity).as("testni podaci moraju imati barem jedno radno mjesto").isPositive();

        int attempts = capacity + 5;
        List<UserView> customers = new ArrayList<>();
        List<VehicleView> vehicles = new ArrayList<>();
        for (int i = 0; i < attempts; i++) {
            UserView customer = fixtures.customer();
            customers.add(customer);
            vehicles.add(fixtures.vehicleFor(customer));
        }

        AtomicInteger booked = new AtomicInteger();
        AtomicInteger rejected = new AtomicInteger();
        List<Throwable> unexpected = java.util.Collections.synchronizedList(new ArrayList<>());

        CountDownLatch startGate = new CountDownLatch(1);
        List<Callable<Void>> tasks = new ArrayList<>();
        for (int i = 0; i < attempts; i++) {
            final int index = i;
            tasks.add(() -> {
                startGate.await();          // svi kreću u isti čas
                try {
                    booking.book(customers.get(index).id(), new AppointmentCreateRequest(
                            serviceId, vehicles.get(index).id(), start, null, null));
                    booked.incrementAndGet();
                } catch (SlotUnavailableException e) {
                    rejected.incrementAndGet();
                } catch (Throwable t) {
                    unexpected.add(t);
                }
                return null;
            });
        }

        try (ExecutorService pool = Executors.newFixedThreadPool(attempts)) {
            List<Future<Void>> futures = tasks.stream().map(pool::submit).toList();
            startGate.countDown();
            for (Future<Void> future : futures) {
                future.get(30, TimeUnit.SECONDS);
            }
        }

        assertThat(unexpected).as("neočekivane greške tijekom paralelnog bookinga").isEmpty();
        assertThat(booked.get()).as("uspješnih rezervacija").isEqualTo(capacity);
        assertThat(rejected.get()).as("odbijenih rezervacija").isEqualTo(attempts - capacity);

        // Konačna provjera ide izravno u bazu: nijedno radno mjesto ne smije
        // imati dva termina u istom vremenu.
        Integer rows = jdbc.queryForObject("""
                SELECT count(*) FROM appointments
                 WHERE start_at = ?
                   AND status IN ('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED')
                """, Integer.class, Timestamp.from(start));
        assertThat(rows).isEqualTo(capacity);

        Integer duplicateBays = jdbc.queryForObject("""
                SELECT count(*) FROM (
                    SELECT bay_id FROM appointments
                     WHERE start_at = ?
                       AND status IN ('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED')
                     GROUP BY bay_id HAVING count(*) > 1
                ) AS duplicates
                """, Integer.class, Timestamp.from(start));
        assertThat(duplicateBays).as("dva termina na istom radnom mjestu u isto vrijeme").isZero();

        assertThat(freeBaysAt(start, serviceId)).isZero();
        assertThat(TestDataFactory.PASSWORD).isNotBlank();
    }

    private int freeBaysAt(Instant start, Long serviceId) {
        DayAvailability day = availability.forDate(
                start.atZone(TestDataFactory.ZONE).toLocalDate(), serviceId);
        return day.slots().stream()
                .filter(s -> s.startAt().equals(start))
                .mapToInt(SlotView::freeBays)
                .findFirst()
                .orElse(-1);
    }
}
