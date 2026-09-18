package hr.demo.vulkanizer.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {

    List<ServiceOffering> findByActiveTrueOrderBySortOrderAscNameAsc(); 

    List<ServiceOffering> findAllByOrderBySortOrderAscNameAsc();

    Optional<ServiceOffering> findByIdAndActiveTrue(Long id);

    boolean existsByNameIgnoreCase(String name);
}
