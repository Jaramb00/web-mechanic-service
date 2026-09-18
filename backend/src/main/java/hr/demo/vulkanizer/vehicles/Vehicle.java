package hr.demo.vulkanizer.vehicles;

import hr.demo.vulkanizer.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "vehicles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class Vehicle extends BaseEntity {

    /** Vlasnik. Nikad se ne mijenja nakon kreiranja — vozilo se ne "prebacuje". */
    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(nullable = false, length = 80)
    private String make;

    @Column(nullable = false, length = 80)
    private String model;

    @Column(name = "model_year")
    private Integer modelYear;

    @Column(nullable = false, length = 20)
    private String registration;

    @Column(name = "tire_size", length = 40)
    private String tireSize;

    @Column(length = 32)
    private String vin;

    Vehicle(Long userId, String make, String model, Integer modelYear, String registration, String tireSize, String vin) {
        this.userId = userId;
        update(make, model, modelYear, registration, tireSize, vin);
    }

    final void update(String make, String model, Integer modelYear, String registration, String tireSize, String vin) {
        this.make = make;
        this.model = model;
        this.modelYear = modelYear;
        this.registration = registration == null ? null : registration.toUpperCase().replace(" ", "");
        this.tireSize = tireSize;
        this.vin = vin;
    }
}
