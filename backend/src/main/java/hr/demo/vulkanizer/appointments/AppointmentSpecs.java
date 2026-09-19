package hr.demo.vulkanizer.appointments;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Filtri za pregled termina u backofficeu.
 *
 * <p>Namjerno NE koristimo obrazac {@code (:param IS NULL OR stupac = :param)}.
 * Hibernate takav imenovani parametar veže dvaput, kao dva zasebna upitnika, pa
 * samostalni {@code ? IS NULL} ostaje bez ikakvog tipskog konteksta. PostgreSQL
 * tada odbija pripremiti izjavu s "could not determine data type of parameter".
 *
 * <p>Specifikacija gradi samo one uvjete koji su stvarno zadani, pa parametar
 * bez vrijednosti nikad ne dođe do baze. Prazan filtar je prazan uvjet.
 */
final class AppointmentSpecs {

    private AppointmentSpecs() {
    }

    static Specification<Appointment> forStaff(AppointmentStatus status, Instant from, Instant to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThan(root.get("startAt"), to));
            }
            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
