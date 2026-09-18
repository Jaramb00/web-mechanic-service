package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.appointments.dto.AppointmentItemView;
import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.catalog.ServiceCatalogFacade;
import hr.demo.vulkanizer.users.UserFacade;
import hr.demo.vulkanizer.users.UserView;
import hr.demo.vulkanizer.vehicles.VehicleFacade;
import hr.demo.vulkanizer.vehicles.VehicleView;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Sastavlja prikaz termina iz podataka više modula.
 *
 * Ovdje se odlučuje i što se KOME pokazuje: kupac ne dobiva podatke o drugim
 * strankama, a ni vlastite podatke kroz ovaj kanal ne treba duplirati.
 */
@Component
class AppointmentAssembler {

    private final AppointmentItemRepository items;
    private final ServiceBayRepository bays;
    private final ServiceCatalogFacade catalog;
    private final VehicleFacade vehicles;
    private final UserFacade users;
    private final AppointmentBookingRules rules;

    AppointmentAssembler(AppointmentItemRepository items, ServiceBayRepository bays,
                         ServiceCatalogFacade catalog, VehicleFacade vehicles,
                         UserFacade users, AppointmentBookingRules rules) {
        this.items = items;
        this.bays = bays;
        this.catalog = catalog;
        this.vehicles = vehicles;
        this.users = users;
        this.rules = rules;
    }

    AppointmentView toViewForCustomer(Appointment appointment) {
        return build(appointment, false);
    }

    AppointmentView toViewForStaff(Appointment appointment) {
        return build(appointment, true);
    }

    private AppointmentView build(Appointment a, boolean includeCustomerContact) {
        List<AppointmentItemView> itemViews = items.findByAppointmentIdOrderByIdAsc(a.getId()).stream()
                .map(AppointmentAssembler::toItemView)
                .toList();
        BigDecimal total = itemViews.stream()
                .map(AppointmentItemView::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        VehicleView vehicle = safeVehicle(a.getVehicleId());
        String serviceName = safeServiceName(a.getServiceId());
        String bayName = bays.findById(a.getBayId()).map(ServiceBay::getName).orElse(null);

        String customerName = null;
        String customerPhone = null;
        if (includeCustomerContact) {
            Optional<UserView> customer = users.findById(a.getCustomerId());
            customerName = customer.map(UserView::fullName).orElse(null);
            customerPhone = customer.map(UserView::phone).orElse(null);
        }

        return new AppointmentView(
                a.getId(), a.getCustomerId(), customerName, customerPhone,
                a.getVehicleId(), vehicle == null ? null : vehicle.label(),
                vehicle == null ? null : vehicle.tireSize(),
                a.getServiceId(), serviceName, bayName,
                a.getStartAt(), a.getEndAt(), a.getStatus(),
                a.getCustomerNote(), a.getMechanicNote(),
                itemViews, total, rules.isCancellableNow(a.getStatus(), a.getStartAt()));
    }

    /** Skupni prikaz bez N+1 upita po vozilu i usluzi. */
    List<AppointmentView> toViewsForStaff(List<Appointment> appointments) {
        if (appointments.isEmpty()) {
            return List.of();
        }
        Map<Long, List<AppointmentItem>> itemsByAppointment = items
                .findByAppointmentIdIn(appointments.stream().map(Appointment::getId).toList())
                .stream()
                .collect(java.util.stream.Collectors.groupingBy(AppointmentItem::getAppointmentId));
        Map<Long, String> bayNames = bays.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(ServiceBay::getId, ServiceBay::getName));

        return appointments.stream().map(a -> {
            List<AppointmentItemView> itemViews = itemsByAppointment
                    .getOrDefault(a.getId(), List.of()).stream()
                    .map(AppointmentAssembler::toItemView).toList();
            BigDecimal total = itemViews.stream().map(AppointmentItemView::lineTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            VehicleView vehicle = safeVehicle(a.getVehicleId());
            Optional<UserView> customer = users.findById(a.getCustomerId());

            return new AppointmentView(a.getId(), a.getCustomerId(),
                    customer.map(UserView::fullName).orElse(null),
                    customer.map(UserView::phone).orElse(null),
                    a.getVehicleId(), vehicle == null ? null : vehicle.label(),
                    vehicle == null ? null : vehicle.tireSize(),
                    a.getServiceId(), safeServiceName(a.getServiceId()),
                    bayNames.get(a.getBayId()), a.getStartAt(), a.getEndAt(), a.getStatus(),
                    a.getCustomerNote(), a.getMechanicNote(), itemViews, total,
                    rules.isCancellableNow(a.getStatus(), a.getStartAt()));
        }).toList();
    }

    private VehicleView safeVehicle(Long vehicleId) {
        try {
            return vehicles.getAny(vehicleId);
        } catch (RuntimeException e) {
            return null;
        }
    }

    private String safeServiceName(Long serviceId) {
        try {
            return catalog.getById(serviceId).name();
        } catch (RuntimeException e) {
            return null;
        }
    }

    private static AppointmentItemView toItemView(AppointmentItem item) {
        BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
        return new AppointmentItemView(item.getId(), item.getProductId(), item.getServiceId(),
                item.getDescription(), item.getQuantity(), item.getUnitPrice(), lineTotal);
    }

}
