package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Servisni termin.
 *
 * Veze na korisnika, vozilo i uslugu su ID-jevi, ne {@code @ManyToOne} —
 * moduli razmjenjuju identitete, ne tuđe entitete. Strani ključevi postoje
 * na razini baze i dalje čuvaju integritet.
 */
@Getter
@Entity
@Table(name = "appointments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class Appointment extends BaseEntity {

    @Column(name = "customer_id", nullable = false, updatable = false)
    private Long customerId;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(name = "service_id", nullable = false)
    private Long serviceId;

    @Column(name = "bay_id", nullable = false)
    private Long bayId;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Column(name = "customer_note", length = 1000)
    private String customerNote;

    @Column(name = "mechanic_note", length = 2000)
    private String mechanicNote;

    Appointment(Long customerId, Long vehicleId, Long serviceId, Long bayId,
                Instant startAt, Instant endAt, String customerNote) {
        this.customerId = customerId;
        this.vehicleId = vehicleId;
        this.serviceId = serviceId;
        this.bayId = bayId;
        this.startAt = startAt;
        this.endAt = endAt;
        this.status = AppointmentStatus.PENDING;
        this.customerNote = customerNote;
    }

    void changeStatus(AppointmentStatus target) {
        this.status = target;
    }

    void setMechanicNote(String note) {
        this.mechanicNote = note;
    }
}
