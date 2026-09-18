package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.appointments.dto.AppointmentCreateRequest;
import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.catalog.ServiceCatalogFacade;
import hr.demo.vulkanizer.catalog.ServiceView;
import hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException;
import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import hr.demo.vulkanizer.common.error.DomainExceptions.SlotUnavailableException;
import hr.demo.vulkanizer.common.web.HoneypotGuard;
import hr.demo.vulkanizer.config.AppProperties;
import hr.demo.vulkanizer.vehicles.VehicleFacade;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Rezervacija i otkazivanje termina.
 *
 * Metoda {@link #book} namjerno NIJE transakcijska: ona koordinira više
 * neovisnih pokušaja upisa (po jedan po radnom mjestu), od kojih svaki ima
 * vlastitu transakciju.
 */
@Service
public class AppointmentBookingService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentBookingService.class);
    private static final String OVERLAP_CONSTRAINT = "appointments_no_overlap";

    private final AppointmentRepository appointments;
    private final ServiceBayRepository bays;
    private final AvailabilityService availability;
    private final BookingAttempt bookingAttempt;
    private final ServiceCatalogFacade catalog;
    private final VehicleFacade vehicles;
    private final AppointmentAssembler assembler;
    private final ApplicationEventPublisher events;
    private final AppProperties.Booking config;

    AppointmentBookingService(AppointmentRepository appointments, ServiceBayRepository bays,
                              AvailabilityService availability, BookingAttempt bookingAttempt,
                              ServiceCatalogFacade catalog, VehicleFacade vehicles,
                              AppointmentAssembler assembler, ApplicationEventPublisher events,
                              AppProperties properties) {
        this.appointments = appointments;
        this.bays = bays;
        this.availability = availability;
        this.bookingAttempt = bookingAttempt;
        this.catalog = catalog;
        this.vehicles = vehicles;
        this.assembler = assembler;
        this.events = events;
        this.config = properties.booking();
    }

    public AppointmentView book(Long customerId, AppointmentCreateRequest request) {
        HoneypotGuard.check(request.website());
        ServiceView service = catalog.getBookable(request.serviceId());

        // Vozilo se dohvaća kroz vlasnika: tuđe vozilo ne postoji u rezultatu,
        // pa se termin ne može vezati na auto druge osobe.
        vehicles.getOwned(request.vehicleId(), customerId);

        Instant start = request.startAt().truncatedTo(ChronoUnit.MINUTES);
        Instant end = start.plus(Duration.ofMinutes(service.durationMinutes()));
        availability.validateSlot(start, end, service.durationMinutes());

        List<Long> bayIds = bays.findByActiveTrueOrderByIdAsc().stream()
                .map(ServiceBay::getId).toList();
        if (bayIds.isEmpty()) {
            throw new BusinessRuleException("Servis trenutno nema dostupnih radnih mjesta.");
        }

        String note = StringUtils.hasText(request.customerNote()) ? request.customerNote().trim() : null;

        for (Long bayId : bayIds) {
            try {
                Long id = bookingAttempt.insert(customerId, request.vehicleId(), request.serviceId(),
                        bayId, start, end, note);
                return assembler.toViewForCustomer(requireById(id));
            } catch (DataIntegrityViolationException e) {
                if (!isOverlapViolation(e)) {
                    throw e;
                }
                log.debug("Radno mjesto {} je zauzeto u {}, pokušavam sljedeće", bayId, start);
            }
        }
        throw new SlotUnavailableException("Odabrani termin je u međuvremenu zauzet. Odaberite drugi.");
    }

    @Transactional
    public AppointmentView cancelAsCustomer(Long appointmentId, Long customerId) {
        Appointment appointment = appointments.findByIdAndCustomerId(appointmentId, customerId)
                .orElseThrow(() -> new NotFoundException("Termin nije pronađen."));

        if (appointment.getStatus().isFinal()) {
            throw new BusinessRuleException("Termin je već zatvoren i ne može se otkazati.");
        }
        if (appointment.getStatus() == AppointmentStatus.IN_PROGRESS) {
            throw new BusinessRuleException("Servis je u tijeku — javite se osoblju servisa.");
        }
        if (!isCancellableNow(appointment)) {
            throw new BusinessRuleException("Termin se može otkazati najkasnije "
                    + config.cancelCutoffHours() + " h prije početka. Nazovite servis.");
        }

        AppointmentStatus previous = appointment.getStatus();
        appointment.changeStatus(AppointmentStatus.CANCELLED);
        events.publishEvent(new AppointmentStatusChangedEvent(appointment.getId(), customerId,
                previous, AppointmentStatus.CANCELLED));
        return assembler.toViewForCustomer(appointment);
    }

    boolean isCancellableNow(Appointment appointment) {
        if (appointment.getStatus() != AppointmentStatus.PENDING
                && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            return false;
        }
        return Instant.now().plus(Duration.ofHours(config.cancelCutoffHours()))
                .isBefore(appointment.getStartAt());
    }

    private Appointment requireById(Long id) {
        return appointments.findById(id).orElseThrow(() -> new NotFoundException("Termin nije pronađen."));
    }

    /**
     * Razlikuje "radno mjesto je zauzeto" od ostalih povreda integriteta —
     * samo prvo znači da ima smisla pokušati drugo radno mjesto.
     */
    private static boolean isOverlapViolation(DataIntegrityViolationException e) {
        Throwable cause = e;
        while (cause != null) {
            String message = cause.getMessage();
            if (message != null && message.contains(OVERLAP_CONSTRAINT)) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }
}
