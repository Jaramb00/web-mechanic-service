package hr.demo.vulkanizer.admin;

import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.inventory.ProductStockView;

import java.util.List;

/** Sve što admin dashboard treba, u jednom pozivu — bez desetak paralelnih zahtjeva. */
public record DashboardSummary(
        long appointmentsToday,
        long appointmentsPending,
        long completedToday,
        long lowStockCount,
        long activeReservations,
        long customersCount,
        long vehiclesCount,
        List<AppointmentView> todaySchedule,
        List<ProductStockView> lowStockItems) {
}
