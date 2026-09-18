package hr.demo.vulkanizer.appointments;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface AppointmentItemRepository extends JpaRepository<AppointmentItem, Long> {

    List<AppointmentItem> findByAppointmentIdOrderByIdAsc(Long appointmentId);

    List<AppointmentItem> findByAppointmentIdIn(List<Long> appointmentIds);
}
