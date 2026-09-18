package hr.demo.vulkanizer.catalog;

import hr.demo.vulkanizer.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Usluga iz cjenika. Cijena i trajanje su isključivo u nadležnosti admina. */
@Getter
@Entity
@Table(name = "services")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class ServiceOffering extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    ServiceOffering(String name, String description, BigDecimal price, int durationMinutes, boolean active, int sortOrder) {
        update(name, description, price, durationMinutes, active, sortOrder);
    }

    final void update(String name, String description, BigDecimal price, int durationMinutes, boolean active, int sortOrder) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.durationMinutes = durationMinutes;
        this.active = active;
        this.sortOrder = sortOrder;
    }
}
