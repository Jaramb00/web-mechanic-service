package hr.demo.vulkanizer.reservations;

import hr.demo.vulkanizer.appointments.AppointmentFacade;
import hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException;
import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import hr.demo.vulkanizer.inventory.InventoryFacade;
import hr.demo.vulkanizer.inventory.ProductView;
import hr.demo.vulkanizer.inventory.StockRef;
import hr.demo.vulkanizer.users.UserFacade;
import hr.demo.vulkanizer.users.UserView;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;

/**
 * Rezervacija artikala.
 *
 * Rezervirana količina se vodi u `inventory` modulu; ovdje se vodi samo namjera
 * kupca. Sve promjene stanja idu kroz {@link InventoryFacade} u istoj
 * transakciji kao i promjena statusa rezervacije — tako ne može nastati
 * rezervacija bez pokrića ni pokriće bez rezervacije.
 */
@Service
public class ReservationService {

    private static final String REF_TYPE = "RESERVATION";

    private final ProductReservationRepository reservations;
    private final InventoryFacade inventory;
    private final AppointmentFacade appointments;
    private final UserFacade users;
    private final ApplicationEventPublisher events;

    ReservationService(ProductReservationRepository reservations, InventoryFacade inventory,
                       AppointmentFacade appointments, UserFacade users, ApplicationEventPublisher events) {
        this.reservations = reservations;
        this.inventory = inventory;
        this.appointments = appointments;
        this.users = users;
        this.events = events;
    }

    @Transactional
    public ReservationView create(Long customerId, ReservationRequest request) {
        ProductView product = inventory.getPublic(request.productId());

        if (request.appointmentId() != null
                && !appointments.isOwnedAndActive(request.appointmentId(), customerId)) {
            // Tuđi ili zatvoren termin — ne otkrivamo koji je od toga.
            throw new NotFoundException("Termin nije pronađen.");
        }

        ProductReservation reservation = reservations.save(new ProductReservation(
                customerId, product.id(), request.appointmentId(), request.quantity(),
                product.salePrice(), trimToNull(request.pickupNote())));

        // Baca InsufficientStockException ako nema dovoljno — cijela transakcija
        // se poništi i rezervacija ne nastane.
        inventory.reserve(product.id(), request.quantity(),
                StockRef.of(REF_TYPE, reservation.getId()), customerId);

        events.publishEvent(new ReservationCreatedEvent(
                reservation.getId(), customerId, product.id(), product.name(), request.quantity()));
        return toView(reservation);
    }

    @Transactional
    public ReservationView cancelAsCustomer(Long reservationId, Long customerId) {
        ProductReservation reservation = reservations.findByIdAndCustomerId(reservationId, customerId)
                .orElseThrow(() -> new NotFoundException("Rezervacija nije pronađena."));
        return cancelInternal(reservation, customerId);
    }

    @Transactional
    public ReservationView cancelAsStaff(Long reservationId, Long actorId) {
        return cancelInternal(require(reservationId), actorId);
    }

    private ReservationView cancelInternal(ProductReservation reservation, Long actorId) {
        if (!reservation.getStatus().isHolding()) {
            throw new BusinessRuleException("Rezervacija se više ne može otkazati.");
        }
        inventory.release(reservation.getProductId(), reservation.getQuantity(),
                StockRef.of(REF_TYPE, reservation.getId()), actorId);
        reservation.changeStatus(ReservationStatus.CANCELLED);
        return toView(reservation);
    }

    @Transactional
    public ReservationView confirm(Long reservationId) {
        ProductReservation reservation = require(reservationId);
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new BusinessRuleException("Potvrditi se može samo rezervacija u statusu 'na čekanju'.");
        }
        reservation.changeStatus(ReservationStatus.CONFIRMED);
        return toView(reservation);
    }

    /** Roba je preuzeta: skida se i s police i s rezervacije. */
    @Transactional
    public ReservationView fulfill(Long reservationId, Long actorId) {
        ProductReservation reservation = require(reservationId);
        if (!reservation.getStatus().isHolding()) {
            throw new BusinessRuleException("Rezervacija je već zatvorena.");
        }
        inventory.consumeReserved(reservation.getProductId(), reservation.getQuantity(),
                StockRef.of(REF_TYPE, reservation.getId()), actorId);
        reservation.changeStatus(ReservationStatus.FULFILLED);
        return toView(reservation);
    }

    @Transactional(readOnly = true)
    public ReservationView getForCustomer(Long reservationId, Long customerId) {
        return reservations.findByIdAndCustomerId(reservationId, customerId)
                .map(this::toView)
                .orElseThrow(() -> new NotFoundException("Rezervacija nije pronađena."));
    }

    @Transactional(readOnly = true)
    public Page<ReservationView> listForCustomer(Long customerId, Pageable pageable) {
        return reservations.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable).map(this::toView);
    }

    @Transactional(readOnly = true)
    public Page<ReservationView> listForStaff(ReservationStatus status, Pageable pageable) {
        Page<ProductReservation> page = status == null
                ? reservations.findAllByOrderByCreatedAtDesc(pageable)
                : reservations.findByStatusOrderByCreatedAtDesc(status, pageable);
        return page.map(this::toView);
    }

    @Transactional(readOnly = true)
    public long countActive() {
        return reservations.countByStatusIn(List.copyOf(ReservationStatus.HOLDING));
    }

    private ProductReservation require(Long id) {
        return reservations.findById(id)
                .orElseThrow(() -> new NotFoundException("Rezervacija nije pronađena."));
    }

    private ReservationView toView(ProductReservation r) {
        ProductView product = safeProduct(r.getProductId());
        UserView customer = users.findById(r.getCustomerId()).orElse(null);
        BigDecimal total = r.getUnitPrice().multiply(BigDecimal.valueOf(r.getQuantity()));
        return new ReservationView(
                r.getId(), r.getCustomerId(), customer == null ? null : customer.fullName(),
                r.getProductId(), product == null ? null : product.sku(),
                product == null ? null : product.name(),
                r.getAppointmentId(), r.getQuantity(), r.getUnitPrice(), total,
                r.getStatus(), r.getPickupNote(), r.getStatus().isHolding(), r.getCreatedAt());
    }

    private ProductView safeProduct(Long productId) {
        try {
            return inventory.getPublic(productId);
        } catch (RuntimeException e) {
            return null; // artikl je u međuvremenu deaktiviran
        }
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
