package hr.demo.vulkanizer.booking;

import hr.demo.vulkanizer.appointments.AppointmentBookingService;
import hr.demo.vulkanizer.appointments.AppointmentStatus;
import hr.demo.vulkanizer.appointments.AvailabilityService;
import hr.demo.vulkanizer.appointments.dto.AppointmentCreateRequest;
import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.appointments.dto.DayAvailability;
import hr.demo.vulkanizer.appointments.dto.SlotView;
import hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException;
import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import hr.demo.vulkanizer.support.AbstractIntegrationTest;
import hr.demo.vulkanizer.users.UserView;
import hr.demo.vulkanizer.vehicles.VehicleView;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingRulesTest extends AbstractIntegrationTest {

    @Autowired
    private AppointmentBookingService booking;

    @Autowired
    private AvailabilityService availability;

    @Test
    @DisplayName("Rezervacija se upisuje s trajanjem usluge i statusom PENDING")
    void bookingCreatesPendingAppointment() {
        UserView customer = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(customer);
        Instant start = fixtures.futureSlot(31, LocalTime.of(8, 0));

        AppointmentView view = booking.book(customer.id(), new AppointmentCreateRequest(
                fixtures.service("Test usluga 60").id(), vehicle.id(), start, "Napomena", null));

        assertThat(view.status()).isEqualTo(AppointmentStatus.PENDING);
        assertThat(view.startAt()).isEqualTo(start);
        // Kraj se računa na serveru iz trajanja usluge — klijent ga ne šalje.
        assertThat(view.endAt()).isEqualTo(start.plus(60, ChronoUnit.MINUTES));
        assertThat(view.bayName()).isNotBlank();
    }

    @Test
    @DisplayName("Termin u prošlosti se odbija")
    void pastSlotIsRejected() {
        UserView customer = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(customer);

        assertThatThrownBy(() -> booking.book(customer.id(), new AppointmentCreateRequest(
                fixtures.service("Test usluga 30").id(), vehicle.id(),
                Instant.now().minus(2, ChronoUnit.DAYS), null, null)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    @DisplayName("Termin izvan radnog vremena se odbija")
    void slotOutsideWorkingHoursIsRejected() {
        UserView customer = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(customer);

        assertThatThrownBy(() -> booking.book(customer.id(), new AppointmentCreateRequest(
                fixtures.service("Test usluga 30").id(), vehicle.id(),
                fixtures.futureSlot(32, LocalTime.of(22, 0)), null, null)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("radnog vremena");
    }

    @Test
    @DisplayName("Termin koji ne leži na mreži slotova se odbija")
    void slotOffGridIsRejected() {
        UserView customer = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(customer);

        assertThatThrownBy(() -> booking.book(customer.id(), new AppointmentCreateRequest(
                fixtures.service("Test usluga 30").id(), vehicle.id(),
                fixtures.futureSlot(33, LocalTime.of(9, 7)), null, null)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    @DisplayName("Termin se ne može rezervirati na tuđe vozilo")
    void cannotBookOnSomeoneElsesVehicle() {
        UserView owner = fixtures.customer();
        UserView intruder = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(owner);

        assertThatThrownBy(() -> booking.book(intruder.id(), new AppointmentCreateRequest(
                fixtures.service("Test usluga 30").id(), vehicle.id(),
                fixtures.futureSlot(34, LocalTime.of(9, 0)), null, null)))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("Neaktivna usluga se ne može rezervirati")
    void inactiveServiceCannotBeBooked() {
        UserView customer = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(customer);

        assertThatThrownBy(() -> booking.book(customer.id(), new AppointmentCreateRequest(
                fixtures.service("Test neaktivna").id(), vehicle.id(),
                fixtures.futureSlot(35, LocalTime.of(9, 0)), null, null)))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("Otkazivanje oslobađa termin — isti slot je ponovno dostupan")
    void cancellationFreesTheSlot() {
        UserView customer = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(customer);
        Long serviceId = fixtures.service("Test usluga 30").id();
        Instant start = fixtures.futureSlot(36, LocalTime.of(8, 0));

        // Popuni sva radna mjesta u istom terminu.
        int capacity = freeBaysAt(start, serviceId);
        assertThat(capacity).isPositive();
        for (int i = 0; i < capacity; i++) {
            booking.book(customer.id(), new AppointmentCreateRequest(serviceId, vehicle.id(), start, null, null));
        }
        assertThat(freeBaysAt(start, serviceId)).isZero();

        AppointmentView last = booking.book(customer.id(),
                new AppointmentCreateRequest(serviceId, vehicle.id(),
                        start.plus(30, ChronoUnit.MINUTES), null, null));
        // Sad otkaži jedan od popunjenih termina i provjeri da se slot oslobodio.
        AppointmentView toCancel = booking.book(customer.id(), new AppointmentCreateRequest(
                serviceId, vehicle.id(), start.plus(60, ChronoUnit.MINUTES), null, null));
        AppointmentView cancelled = booking.cancelAsCustomer(toCancel.id(), customer.id());

        assertThat(cancelled.status()).isEqualTo(AppointmentStatus.CANCELLED);
        assertThat(freeBaysAt(start.plus(60, ChronoUnit.MINUTES), serviceId)).isPositive();
        assertThat(last.id()).isNotNull();
    }

    @Test
    @DisplayName("Otkazani termin se ne može otkazati drugi put")
    void cannotCancelTwice() {
        UserView customer = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(customer);
        AppointmentView appointment = booking.book(customer.id(), new AppointmentCreateRequest(
                fixtures.service("Test usluga 30").id(), vehicle.id(),
                fixtures.futureSlot(37, LocalTime.of(10, 0)), null, null));

        booking.cancelAsCustomer(appointment.id(), customer.id());

        assertThatThrownBy(() -> booking.cancelAsCustomer(appointment.id(), customer.id()))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    @DisplayName("Na neradni dan se ne nude termini")
    void closedDayOffersNoSlots() {
        LocalDate sunday = LocalDate.now(fixtures.ZONE).plusDays(1);
        while (sunday.getDayOfWeek() != DayOfWeek.SUNDAY) {
            sunday = sunday.plusDays(1);
        }
        DayAvailability result = availability.forDate(sunday, fixtures.service("Test usluga 30").id());

        assertThat(result.closed()).isTrue();
        assertThat(result.slots()).isEmpty();
    }

    private int freeBaysAt(Instant start, Long serviceId) {
        DayAvailability day = availability.forDate(
                start.atZone(fixtures.ZONE).toLocalDate(), serviceId);
        return day.slots().stream()
                .filter(s -> s.startAt().equals(start))
                .mapToInt(SlotView::freeBays)
                .findFirst()
                .orElse(-1);
    }
}
