package hr.demo.vulkanizer.admin;

import hr.demo.vulkanizer.appointments.AppointmentFacade;
import hr.demo.vulkanizer.appointments.AppointmentQueryService;
import hr.demo.vulkanizer.appointments.AppointmentStatus;
import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.config.AppProperties;
import hr.demo.vulkanizer.inventory.InventoryFacade;
import hr.demo.vulkanizer.inventory.ProductStockView;
import hr.demo.vulkanizer.reservations.ReservationService;
import hr.demo.vulkanizer.users.RoleName;
import hr.demo.vulkanizer.users.UserFacade;
import hr.demo.vulkanizer.vehicles.VehicleFacade;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
class AdminDashboardService {

    private final AppointmentFacade appointmentFacade;
    private final AppointmentQueryService appointmentQuery;
    private final InventoryFacade inventory;
    private final ReservationService reservations;
    private final UserFacade users;
    private final VehicleFacade vehicles;
    private final AppProperties properties;

    AdminDashboardService(AppointmentFacade appointmentFacade, AppointmentQueryService appointmentQuery,
                          InventoryFacade inventory, ReservationService reservations,
                          UserFacade users, VehicleFacade vehicles, AppProperties properties) {
        this.appointmentFacade = appointmentFacade;
        this.appointmentQuery = appointmentQuery;
        this.inventory = inventory;
        this.reservations = reservations;
        this.users = users;
        this.vehicles = vehicles;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    DashboardSummary summary() {
        LocalDate today = LocalDate.now(properties.booking().zone());
        List<AppointmentView> schedule = appointmentQuery.listForDay(today);
        List<ProductStockView> lowStock = inventory.lowStock();

        return new DashboardSummary(
                appointmentFacade.countForDay(today),
                appointmentFacade.countByStatus(AppointmentStatus.PENDING),
                appointmentFacade.countCompletedForDay(today),
                lowStock.size(),
                reservations.countActive(),
                users.countByRole(RoleName.CUSTOMER),
                vehicles.countAll(),
                schedule,
                lowStock);
    }
}
