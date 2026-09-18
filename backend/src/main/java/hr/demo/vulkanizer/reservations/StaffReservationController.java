package hr.demo.vulkanizer.reservations;

import hr.demo.vulkanizer.auth.AppPrincipal;
import hr.demo.vulkanizer.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Rezervacije iz perspektive servisa — potvrda, izdavanje i otkazivanje. */
@Tag(name = "Rezervacije (osoblje)")
@RestController
@RequestMapping("/api/staff/reservations")
@PreAuthorize("hasAnyRole('WAREHOUSE_WORKER', 'ADMIN')")
@Validated
class StaffReservationController {

    private final ReservationService reservations;

    StaffReservationController(ReservationService reservations) {
        this.reservations = reservations;
    }

    @Operation(summary = "Popis rezervacija s filtrom po statusu")
    @GetMapping
    PageResponse<ReservationView> list(@RequestParam(required = false) ReservationStatus status,
                                       @RequestParam(defaultValue = "0") @Min(0) int page,
                                       @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        var result = reservations.listForStaff(status, PageRequest.of(page, size));
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Operation(summary = "Potvrda rezervacije")
    @PostMapping("/{id}/confirm")
    ReservationView confirm(@PathVariable Long id) {
        return reservations.confirm(id);
    }

    @Operation(summary = "Izdavanje robe kupcu")
    @PostMapping("/{id}/fulfill")
    ReservationView fulfill(@AuthenticationPrincipal AppPrincipal me, @PathVariable Long id) {
        return reservations.fulfill(id, me.userId());
    }

    @Operation(summary = "Otkazivanje rezervacije")
    @PostMapping("/{id}/cancel")
    ReservationView cancel(@AuthenticationPrincipal AppPrincipal me, @PathVariable Long id) {
        return reservations.cancelAsStaff(id, me.userId());
    }
}
