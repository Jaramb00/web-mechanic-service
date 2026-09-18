package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * Radno vrijeme po danu u tjednu (1 = ponedjeljak … 7 = nedjelja).
 *
 * DEMO: jedan raspon po danu. Model je namjerno odvojen od logike izračuna
 * slotova, pa se kasnije mogu dodati pauze, praznici i sezonsko vrijeme bez
 * diranja bookinga.
 */
@Getter
@Entity
@Table(name = "working_hours")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class WorkingHours extends BaseEntity {

    @Column(name = "day_of_week", nullable = false, unique = true)
    private int dayOfWeek;

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    @Column(nullable = false)
    private boolean closed;

    void update(LocalTime openTime, LocalTime closeTime, boolean closed) {
        this.openTime = closed ? null : openTime;
        this.closeTime = closed ? null : closeTime;
        this.closed = closed;
    }
}
