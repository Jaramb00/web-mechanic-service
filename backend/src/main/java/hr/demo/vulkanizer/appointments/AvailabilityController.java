package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.appointments.dto.DayAvailability;
import hr.demo.vulkanizer.appointments.dto.NextSlot;
import hr.demo.vulkanizer.appointments.dto.WorkingHoursView;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Javna dostupnost termina i radno vrijeme — javna stranica ih prikazuje bez
 * prijave, a booking forma ih traži prije registracije.
 */
@Tag(name = "Dostupnost termina (javno)")
@RestController
class AvailabilityController {

    private final AvailabilityService availability;
    private final WorkingHoursService workingHours;

    AvailabilityController(AvailabilityService availability, WorkingHoursService workingHours) {
        this.availability = availability;
        this.workingHours = workingHours;
    }

    @Operation(summary = "Slobodni termini za odabrani dan i uslugu")
    @GetMapping("/api/availability")
    DayAvailability forDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                            @RequestParam Long serviceId) {
        return availability.forDate(date, serviceId);
    }

    @Operation(summary = "Prvi slobodan termin — jedan upit umjesto pretraživanja dan po dan")
    @GetMapping("/api/availability/next")
    ResponseEntity<NextSlot> nextFree(@RequestParam(required = false) Long serviceId) {
        return availability.nextFreeSlot(serviceId)
                .map(ResponseEntity::ok)
                // 204 kad termina nema: to nije greška nego stanje koje javna
                // stranica mora znati prikazati (u sezoni je uobičajeno).
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @Operation(summary = "Radno vrijeme servisa")
    @GetMapping("/api/working-hours")
    List<WorkingHoursView> workingHours() {
        return workingHours.list();
    }
}
