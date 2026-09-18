package hr.demo.vulkanizer.admin;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin dashboard")
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
class AdminDashboardController {

    private final AdminDashboardService dashboard;

    AdminDashboardController(AdminDashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @Operation(summary = "Pregled dana: termini, zaliha, rezervacije")
    @GetMapping("/dashboard")
    DashboardSummary dashboard() {
        return dashboard.summary();
    }
}
