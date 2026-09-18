package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.appointments.dto.DayAvailability;
import hr.demo.vulkanizer.appointments.dto.SlotView;
import hr.demo.vulkanizer.catalog.ServiceCatalogFacade;
import hr.demo.vulkanizer.catalog.ServiceView;
import hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException;
import hr.demo.vulkanizer.config.AppProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Izračun slobodnih termina.
 *
 * DEMO: fiksna mreža slotova (npr. svakih 30 min) unutar radnog vremena, uz
 * kapacitet jednak broju aktivnih radnih mjesta. Pravila su namjerno izolirana
 * ovdje, pa se kasnije mogu zamijeniti fleksibilnijima (pauze, praznici,
 * različiti kapaciteti po usluzi) bez diranja ostatka bookinga.
 *
 * VAŽNO: rezultat ove metode je samo prijedlog. Stvarnu zauzetost jamči
 * isključivo EXCLUDE constraint u bazi pri upisu termina — između prikaza
 * slotova i potvrde rezervacije netko drugi može zauzeti isti termin.
 */
@Service
public class AvailabilityService {

    private final AppointmentRepository appointments;
    private final ServiceBayRepository bays;
    private final WorkingHoursRepository workingHours;
    private final ServiceCatalogFacade catalog;
    private final AppProperties.Booking config;

    AvailabilityService(AppointmentRepository appointments, ServiceBayRepository bays,
                        WorkingHoursRepository workingHours, ServiceCatalogFacade catalog,
                        AppProperties properties) {
        this.appointments = appointments;
        this.bays = bays;
        this.workingHours = workingHours;
        this.catalog = catalog;
        this.config = properties.booking();
    }

    @Transactional(readOnly = true)
    public DayAvailability forDate(LocalDate date, Long serviceId) {
        ServiceView service = catalog.getBookable(serviceId);
        ZoneId zone = config.zone();
        LocalDate today = LocalDate.now(zone);

        if (date.isBefore(today)) {
            return new DayAvailability(date, true, "Datum je u prošlosti.", List.of());
        }
        if (date.isAfter(today.plusDays(config.horizonDays()))) {
            return new DayAvailability(date, true,
                    "Termini se mogu rezervirati najviše " + config.horizonDays() + " dana unaprijed.", List.of());
        }

        Optional<WorkingHours> hours = workingHours.findByDayOfWeek(date.getDayOfWeek().getValue());
        if (hours.isEmpty() || hours.get().isClosed()) {
            return new DayAvailability(date, true, "Servis ne radi na taj dan.", List.of());
        }

        int activeBays = (int) bays.countByActiveTrue();
        if (activeBays == 0) {
            return new DayAvailability(date, true, "Nema dostupnih radnih mjesta.", List.of());
        }

        return new DayAvailability(date, false, null,
                buildSlots(date, zone, hours.get(), service.durationMinutes(), activeBays));
    }

    private List<SlotView> buildSlots(LocalDate date, ZoneId zone, WorkingHours hours,
                                      int durationMinutes, int activeBays) {
        Instant dayStart = date.atStartOfDay(zone).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(zone).toInstant();

        // Termini koji ulaze u ovaj dan; ostatak je nebitan za izračun.
        List<Appointment> sameDay = appointments.findOverlapping(dayStart, dayEnd, AppointmentStatus.BLOCKING);

        Instant now = Instant.now();
        Duration duration = Duration.ofMinutes(durationMinutes);
        LocalTime close = hours.getCloseTime();
        List<SlotView> slots = new ArrayList<>();

        for (LocalTime time = hours.getOpenTime();
             !time.plusMinutes(durationMinutes).isAfter(close);
             time = time.plusMinutes(config.slotMinutes())) {

            Instant start = LocalDateTime.of(date, time).atZone(zone).toInstant();
            Instant end = start.plus(duration);

            // Termin u prošlosti se ne nudi ni kao zauzet — samo ga nema.
            if (end.isBefore(now) || start.isBefore(now)) {
                continue;
            }

            long busy = sameDay.stream()
                    .filter(a -> a.getStartAt().isBefore(end) && a.getEndAt().isAfter(start))
                    .map(Appointment::getBayId)
                    .distinct()
                    .count();

            int freeBays = Math.max(0, activeBays - (int) busy);
            slots.add(new SlotView(start, end, freeBays > 0, freeBays));

            if (time.plusMinutes(config.slotMinutes()).isBefore(time)) {
                break; // zaštita od prelaska preko ponoći
            }
        }
        return slots;
    }

    /** Provjere koje se rade prije upisa termina; baca ako termin nije legitiman. */
    void validateSlot(Instant startAt, Instant endAt, int durationMinutes) {
        ZoneId zone = config.zone();
        Instant now = Instant.now();

        if (!startAt.isAfter(now)) {
            throw new BusinessRuleException("Termin mora biti u budućnosti.");
        }
        LocalDate date = startAt.atZone(zone).toLocalDate();
        if (date.isAfter(LocalDate.now(zone).plusDays(config.horizonDays()))) {
            throw new BusinessRuleException(
                    "Termin se može rezervirati najviše " + config.horizonDays() + " dana unaprijed.");
        }

        WorkingHours hours = workingHours.findByDayOfWeek(date.getDayOfWeek().getValue())
                .orElseThrow(() -> new BusinessRuleException("Servis ne radi na odabrani dan."));
        if (hours.isClosed()) {
            throw new BusinessRuleException("Servis ne radi na odabrani dan.");
        }

        LocalTime start = startAt.atZone(zone).toLocalTime();
        LocalTime end = endAt.atZone(zone).toLocalTime();
        if (start.isBefore(hours.getOpenTime()) || end.isAfter(hours.getCloseTime())) {
            throw new BusinessRuleException("Odabrani termin je izvan radnog vremena servisa.");
        }

        // Termin mora ležati na mreži slotova — inače bi se rezervacijom u
        // 09:07 nepotrebno rascjepkao raspored.
        long minutesFromOpen = Duration.between(hours.getOpenTime(), start).toMinutes();
        if (minutesFromOpen % config.slotMinutes() != 0) {
            throw new BusinessRuleException("Odabrani termin ne odgovara rasporedu termina.");
        }
        if (durationMinutes <= 0) {
            throw new BusinessRuleException("Trajanje usluge nije ispravno.");
        }
    }
}
