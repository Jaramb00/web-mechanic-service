package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Radno mjesto (dizalica). Kapacitet servisa po terminu = broj aktivnih
 * radnih mjesta; nije brojač nego stvarni redci, jer se preklapanje sprječava
 * po konkretnom radnom mjestu.
 */
@Getter
@Entity
@Table(name = "service_bays")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class ServiceBay extends BaseEntity {

    @Column(nullable = false, unique = true, length = 60)
    private String name;

    @Column(nullable = false)
    private boolean active = true;
}
