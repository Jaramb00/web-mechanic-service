package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.appointments.dto.AppointmentCreateRequest;
import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.auth.AppPrincipal;
import hr.demo.vulkanizer.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Termini prijavljenog kupca. */
@Tag(name = "Moji termini")
@RestController
@PreAuthorize("hasRole('CUSTOMER')")
@Validated
class MyAppointmentController {

    private final AppointmentBookingService booking;
    private final AppointmentQueryService query;

    MyAppointmentController(AppointmentBookingService booking, AppointmentQueryService query) {
        this.booking = booking;
        this.query = query;
    }

    @Operation(summary = "Rezervacija termina")
    @PostMapping("/api/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    AppointmentView book(@AuthenticationPrincipal AppPrincipal me,
                         @Valid @RequestBody AppointmentCreateRequest request) {
        return booking.book(me.userId(), request);
    }

    @Operation(summary = "Popis mojih termina")
    @GetMapping("/api/me/appointments")
    PageResponse<AppointmentView> list(@AuthenticationPrincipal AppPrincipal me,
                                       @RequestParam(defaultValue = "0") @Min(0) int page,
                                       @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        var result = query.listForCustomer(me.userId(), PageRequest.of(page, size));
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Operation(summary = "Detalji mog termina")
    @GetMapping("/api/me/appointments/{id}")
    AppointmentView get(@AuthenticationPrincipal AppPrincipal me, @PathVariable Long id) {
        return query.getForCustomer(id, me.userId());
    }

    @Operation(summary = "Otkazivanje termina")
    @PostMapping("/api/me/appointments/{id}/cancel")
    AppointmentView cancel(@AuthenticationPrincipal AppPrincipal me, @PathVariable Long id) {
        return booking.cancelAsCustomer(id, me.userId());
    }
}
