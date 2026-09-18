package hr.demo.vulkanizer.reservations;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Moje rezervacije artikala")
@RestController
@RequestMapping("/api/me/reservations")
@PreAuthorize("hasRole('CUSTOMER')")
@Validated
class MyReservationController {

    private final ReservationService reservations;

    MyReservationController(ReservationService reservations) {
        this.reservations = reservations;
    }

    @Operation(summary = "Rezervacija artikla")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ReservationView create(@AuthenticationPrincipal AppPrincipal me, @Valid @RequestBody ReservationRequest request) {
        return reservations.create(me.userId(), request);
    }

    @Operation(summary = "Popis mojih rezervacija")
    @GetMapping
    PageResponse<ReservationView> list(@AuthenticationPrincipal AppPrincipal me,
                                       @RequestParam(defaultValue = "0") @Min(0) int page,
                                       @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        var result = reservations.listForCustomer(me.userId(), PageRequest.of(page, size));
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Operation(summary = "Detalji moje rezervacije")
    @GetMapping("/{id}")
    ReservationView get(@AuthenticationPrincipal AppPrincipal me, @PathVariable Long id) {
        return reservations.getForCustomer(id, me.userId());
    }

    @Operation(summary = "Otkazivanje rezervacije (roba se vraća u raspoloživu zalihu)")
    @PostMapping("/{id}/cancel")
    ReservationView cancel(@AuthenticationPrincipal AppPrincipal me, @PathVariable Long id) {
        return reservations.cancelAsCustomer(id, me.userId());
    }
}
