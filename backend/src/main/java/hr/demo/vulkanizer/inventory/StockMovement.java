package hr.demo.vulkanizer.inventory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Knjiga prometa zalihe. Zapisi se samo dodaju — nikad se ne mijenjaju ni brišu,
 * pa je stanje uvijek moguće objasniti unatrag.
 */
@Getter
@Entity
@Table(name = "stock_movements")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 20)
    private MovementType movementType;

    @Column(name = "delta_physical", nullable = false)
    private int deltaPhysical;

    @Column(name = "delta_reserved", nullable = false)
    private int deltaReserved;

    @Column(name = "reference_type", length = 30)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(length = 500)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    StockMovement(Long productId, MovementType movementType, int deltaPhysical, int deltaReserved,
                  StockRef ref, Long createdBy, String note) {
        this.productId = productId;
        this.movementType = movementType;
        this.deltaPhysical = deltaPhysical;
        this.deltaReserved = deltaReserved;
        this.referenceType = ref == null ? null : ref.type();
        this.referenceId = ref == null ? null : ref.id();
        this.createdBy = createdBy;
        this.note = note;
    }
}
