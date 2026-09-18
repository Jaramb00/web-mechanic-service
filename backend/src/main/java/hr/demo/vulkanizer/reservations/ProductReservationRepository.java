package hr.demo.vulkanizer.reservations;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;

interface ProductReservationRepository extends JpaRepository<ProductReservation, Long> {

    /** Zaštita od IDOR-a: vlasnik je dio upita. */
    Optional<ProductReservation> findByIdAndCustomerId(Long id, Long customerId);

    Page<ProductReservation> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);

    Page<ProductReservation> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ProductReservation> findByStatusOrderByCreatedAtDesc(ReservationStatus status, Pageable pageable);

    long countByStatusIn(Collection<ReservationStatus> statuses);
}
