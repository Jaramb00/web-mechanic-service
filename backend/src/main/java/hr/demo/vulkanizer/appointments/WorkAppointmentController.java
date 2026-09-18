package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.appointments.dto.AppointmentItemRequest;
import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.appointments.dto.MechanicNoteRequest;
import hr.demo.vulkanizer.appointments.dto.StatusChangeRequest;
import hr.demo.vulkanizer.auth.AppPrincipal;
import hr.demo.vulkanizer.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Radni pregled za majstora i administratora.
 *
 * Status se mijenja namjernim endpointom, nikad PATCH-em s poljem `status` —
 * time je nemoguće "preskočiti" korak slanjem izmijenjenog tijela zahtjeva.
 */
@Tag(name = "Radni nalozi (osoblje)")
@RestController
@RequestMapping("/api/work/appointments")
@PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
@Validated
class WorkAppointmentController {

    private final AppointmentQueryService query;
    private final AppointmentWorkService work;

    WorkAppointmentController(AppointmentQueryService query, AppointmentWorkService work) {
        this.query = query;
        this.work = work;
    }

    @Operation(summary = "Termini za jedan dan (radni raspored)")
    @GetMapping("/day")
    List<AppointmentView> day(@RequestParam(required = false)
                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return query.listForDay(date == null ? LocalDate.now() : date);
    }

    @Operation(summary = "Pretraga termina s filtrima i paginacijom")
    @GetMapping
    PageResponse<AppointmentView> list(@RequestParam(required = false) AppointmentStatus status,
                                       @RequestParam(required = false)
                                       @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                       @RequestParam(required = false)
                                       @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                       @RequestParam(defaultValue = "0") @Min(0) int page,
                                       @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        var result = query.listForStaff(status, from, to,
                PageRequest.of(page, size, Sort.by("startAt").descending()));
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Operation(summary = "Detalji termina, s podacima o stranci i vozilu")
    @GetMapping("/{id}")
    AppointmentView get(@PathVariable Long id) {
        return query.getForStaff(id);
    }

    @Operation(summary = "Promjena statusa termina")
    @PostMapping("/{id}/status")
    AppointmentView changeStatus(@PathVariable Long id, @Valid @RequestBody StatusChangeRequest request) {
        return work.changeStatus(id, request.status());
    }

    @Operation(summary = "Servisna napomena majstora")
    @PutMapping("/{id}/note")
    AppointmentView setNote(@PathVariable Long id, @Valid @RequestBody MechanicNoteRequest request) {
        return work.setMechanicNote(id, request.note());
    }

    @Operation(summary = "Evidentiranje utrošenog artikla ili usluge")
    @PostMapping("/{id}/items")
    AppointmentView addItem(@AuthenticationPrincipal AppPrincipal me, @PathVariable Long id,
                            @Valid @RequestBody AppointmentItemRequest request) {
        return work.addItem(id, request, me.userId());
    }

    @Operation(summary = "Storno stavke (artikl se vraća na zalihu uz zapis korekcije)")
    @DeleteMapping("/{id}/items/{itemId}")
    AppointmentView removeItem(@AuthenticationPrincipal AppPrincipal me,
                               @PathVariable Long id, @PathVariable Long itemId) {
        return work.removeItem(id, itemId, me.userId());
    }
}
