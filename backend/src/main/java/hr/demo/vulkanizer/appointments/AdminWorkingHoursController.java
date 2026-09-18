package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.appointments.dto.WorkingHoursRequest;
import hr.demo.vulkanizer.appointments.dto.WorkingHoursView;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Radno vrijeme (admin)")
@RestController
@RequestMapping("/api/admin/working-hours")
@PreAuthorize("hasRole('ADMIN')")
class AdminWorkingHoursController {

    private final WorkingHoursService workingHours;

    AdminWorkingHoursController(WorkingHoursService workingHours) {
        this.workingHours = workingHours;
    }

    @Operation(summary = "Radno vrijeme po danima")
    @GetMapping
    List<WorkingHoursView> list() {
        return workingHours.list();
    }

    @Operation(summary = "Izmjena radnog vremena za jedan dan")
    @PutMapping
    WorkingHoursView update(@Valid @RequestBody WorkingHoursRequest request) {
        return workingHours.update(request);
    }
}
