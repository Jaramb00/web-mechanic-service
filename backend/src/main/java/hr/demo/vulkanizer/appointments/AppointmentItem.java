package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Stavka odrađenog termina — utrošeni artikl ili obavljena usluga.
 *
 * Cijena se snima u trenutku evidentiranja (snapshot): kasnija promjena
 * cjenika ne smije retroaktivno mijenjati već odrađene naloge.
 */
@Getter
@Entity
@Table(name = "appointment_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class AppointmentItem extends BaseEntity {

    @Column(name = "appointment_id", nullable = false, updatable = false)
    private Long appointmentId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "service_id")
    private Long serviceId;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    AppointmentItem(Long appointmentId, Long productId, Long serviceId,
                    String description, int quantity, BigDecimal unitPrice) {
        this.appointmentId = appointmentId;
        this.productId = productId;
        this.serviceId = serviceId;
        this.description = description;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }
}
