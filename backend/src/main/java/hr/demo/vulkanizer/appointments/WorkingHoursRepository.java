package hr.demo.vulkanizer.appointments;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface WorkingHoursRepository extends JpaRepository<WorkingHours, Long> {

    Optional<WorkingHours> findByDayOfWeek(int dayOfWeek);

    List<WorkingHours> findAllByOrderByDayOfWeekAsc();
}
