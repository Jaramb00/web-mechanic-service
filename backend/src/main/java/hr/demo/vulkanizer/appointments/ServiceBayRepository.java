package hr.demo.vulkanizer.appointments;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface ServiceBayRepository extends JpaRepository<ServiceBay, Long> {

    List<ServiceBay> findByActiveTrueOrderByIdAsc();

    long countByActiveTrue();
}
