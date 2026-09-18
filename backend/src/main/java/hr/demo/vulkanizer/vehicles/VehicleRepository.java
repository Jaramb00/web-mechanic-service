package hr.demo.vulkanizer.vehicles;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    /**
     * Ključna metoda za zaštitu od IDOR-a: vlasnik je dio upita, ne naknadna
     * provjera. Tuđe vozilo jednostavno ne postoji u rezultatu.
     */
    Optional<Vehicle> findByIdAndUserId(Long id, Long userId);

    List<Vehicle> findByUserIdOrderByMakeAscModelAsc(Long userId);

    boolean existsByRegistrationIgnoreCase(String registration);

    Optional<Vehicle> findByRegistrationIgnoreCase(String registration);

    long countByUserId(Long userId);
}
