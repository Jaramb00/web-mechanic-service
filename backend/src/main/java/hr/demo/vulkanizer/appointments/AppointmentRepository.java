package hr.demo.vulkanizer.appointments;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

interface AppointmentRepository extends JpaRepository<Appointment, Long>, JpaSpecificationExecutor<Appointment> {

    /** Zaštita od IDOR-a: vlasnik je dio upita, ne naknadna provjera. */
    Optional<Appointment> findByIdAndCustomerId(Long id, Long customerId);

    Page<Appointment> findByCustomerIdOrderByStartAtDesc(Long customerId, Pageable pageable);

    @Query("""
            SELECT a FROM Appointment a
            WHERE a.startAt >= :from AND a.startAt < :to
            ORDER BY a.startAt ASC
            """)
    List<Appointment> findInRange(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
            SELECT a FROM Appointment a
            WHERE a.startAt < :to AND a.endAt > :from AND a.status IN :statuses
            """)
    List<Appointment> findOverlapping(@Param("from") Instant from,
                                      @Param("to") Instant to,
                                      @Param("statuses") Collection<AppointmentStatus> statuses);

    long countByStartAtGreaterThanEqualAndStartAtLessThan(Instant from, Instant to);

    long countByStatus(AppointmentStatus status);

    long countByStatusAndStartAtGreaterThanEqualAndStartAtLessThan(AppointmentStatus status, Instant from, Instant to);

    boolean existsByVehicleIdAndStatusIn(Long vehicleId, Collection<AppointmentStatus> statuses);
}
