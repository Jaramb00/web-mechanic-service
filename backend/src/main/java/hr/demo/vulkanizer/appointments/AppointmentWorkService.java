package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.appointments.dto.AppointmentItemRequest;
import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.catalog.ServiceCatalogFacade;
import hr.demo.vulkanizer.catalog.ServiceView;
import hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException;
import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import hr.demo.vulkanizer.inventory.InventoryFacade;
import hr.demo.vulkanizer.inventory.ProductStockView;
import hr.demo.vulkanizer.inventory.StockRef;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;

/**
 * Radnje osoblja nad terminom: promjena statusa, napomene i evidencija utroška.
 *
 * Cijene stavki se UVIJEK uzimaju sa servera. Klijent šalje samo što i koliko.
 */
@Service
public class AppointmentWorkService {

    private final AppointmentRepository appointments;
    private final AppointmentItemRepository items;
    private final AppointmentAssembler assembler;
    private final InventoryFacade inventory;
    private final ServiceCatalogFacade catalog;
    private final ApplicationEventPublisher events;

    AppointmentWorkService(AppointmentRepository appointments, AppointmentItemRepository items,
                           AppointmentAssembler assembler, InventoryFacade inventory,
                           ServiceCatalogFacade catalog, ApplicationEventPublisher events) {
        this.appointments = appointments;
        this.items = items;
        this.assembler = assembler;
        this.inventory = inventory;
        this.catalog = catalog;
        this.events = events;
    }

    @Transactional
    public AppointmentView changeStatus(Long appointmentId, AppointmentStatus target) {
        Appointment appointment = require(appointmentId);
        AppointmentStatus current = appointment.getStatus();

        if (current == target) {
            return assembler.toViewForStaff(appointment);
        }
        if (!current.canTransitionTo(target)) {
            throw new BusinessRuleException(
                    "Prijelaz iz statusa " + current + " u " + target + " nije dopušten.");
        }
        appointment.changeStatus(target);
        events.publishEvent(new AppointmentStatusChangedEvent(
                appointment.getId(), appointment.getCustomerId(), current, target));
        return assembler.toViewForStaff(appointment);
    }

    @Transactional
    public AppointmentView setMechanicNote(Long appointmentId, String note) {
        Appointment appointment = require(appointmentId);
        appointment.setMechanicNote(StringUtils.hasText(note) ? note.trim() : null);
        return assembler.toViewForStaff(appointment);
    }

    @Transactional
    public AppointmentView addItem(Long appointmentId, AppointmentItemRequest request, Long actorId) {
        Appointment appointment = require(appointmentId);
        if (appointment.getStatus().isFinal() && appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new BusinessRuleException("Na otkazani termin se ne može evidentirati utrošak.");
        }
        boolean hasProduct = request.productId() != null;
        boolean hasService = request.serviceId() != null;
        if (hasProduct == hasService) {
            throw new BusinessRuleException("Stavka mora biti ili artikl ili usluga.");
        }

        AppointmentItem item;
        if (hasProduct) {
            ProductStockView product = inventory.getForStaff(request.productId());
            // Skidanje s police se događa u istoj transakciji kao i zapis
            // stavke — nema stavke bez traga u knjizi prometa.
            inventory.consumeFree(product.id(), request.quantity(),
                    StockRef.of("APPOINTMENT", appointmentId), actorId);
            item = new AppointmentItem(appointmentId, product.id(), null,
                    product.name(), request.quantity(), product.salePrice());
        } else {
            ServiceView service = catalog.getById(request.serviceId());
            item = new AppointmentItem(appointmentId, null, service.id(),
                    service.name(), request.quantity(), service.price());
        }
        items.save(item);
        return assembler.toViewForStaff(appointment);
    }

    @Transactional
    public AppointmentView removeItem(Long appointmentId, Long itemId, Long actorId) {
        Appointment appointment = require(appointmentId);
        AppointmentItem item = items.findById(itemId)
                .filter(i -> i.getAppointmentId().equals(appointmentId))
                .orElseThrow(() -> new NotFoundException("Stavka nije pronađena."));

        if (item.getProductId() != null) {
            inventory.revertUsage(item.getProductId(), item.getQuantity(),
                    StockRef.of("APPOINTMENT", appointmentId), actorId,
                    "Storno stavke naloga #" + appointmentId);
        }
        items.delete(item);
        return assembler.toViewForStaff(appointment);
    }

    /** Ukupan iznos stavki — koristi ga admin pregled. */
    @Transactional(readOnly = true)
    public BigDecimal itemsTotal(Long appointmentId) {
        return items.findByAppointmentIdOrderByIdAsc(appointmentId).stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Appointment require(Long id) {
        return appointments.findById(id)
                .orElseThrow(() -> new NotFoundException("Termin nije pronađen."));
    }
}
