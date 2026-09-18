package hr.demo.vulkanizer.reservations;

import hr.demo.vulkanizer.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "product_reservations")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class ProductReservation extends BaseEntity {

    @Column(name = "customer_id", nullable = false, updatable = false)
    private Long customerId;

    @Column(name = "product_id", nullable = false, updatable = false)
    private Long productId;

    /** Neobavezna veza na servisni termin (roba se preuzima uz servis). */
    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(nullable = false)
    private int quantity;

    /** Cijena u trenutku rezervacije — kasnija promjena cjenika je ne dira. */
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ReservationStatus status = ReservationStatus.PENDING;

    @Column(name = "pickup_note", length = 500)
    private String pickupNote;

    ProductReservation(Long customerId, Long productId, Long appointmentId, int quantity,
                       BigDecimal unitPrice, String pickupNote) {
        this.customerId = customerId;
        this.productId = productId;
        this.appointmentId = appointmentId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.pickupNote = pickupNote;
        this.status = ReservationStatus.PENDING;
    }

    void changeStatus(ReservationStatus target) {
        this.status = target;
    }
}
