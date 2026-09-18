package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.config.AppProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
class AppointmentFacadeImpl implements AppointmentFacade {

    private final AppointmentRepository appointments;
    private final ZoneId zone;

    AppointmentFacadeImpl(AppointmentRepository appointments, AppProperties properties) {
        this.appointments = appointments;
        this.zone = properties.booking().zone();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isOwnedAndActive(Long appointmentId, Long customerId) {
        return appointments.findByIdAndCustomerId(appointmentId, customerId)
                .map(a -> a.getStatus().isBlocking())
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public long countForDay(LocalDate date) {
        return appointments.countByStartAtGreaterThanEqualAndStartAtLessThan(startOf(date), startOf(date.plusDays(1)));
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatus(AppointmentStatus status) {
        return appointments.countByStatus(status);
    }

    @Override
    @Transactional(readOnly = true)
    public long countCompletedForDay(LocalDate date) {
        return appointments.countByStatusAndStartAtGreaterThanEqualAndStartAtLessThan(
                AppointmentStatus.COMPLETED, startOf(date), startOf(date.plusDays(1)));
    }

    private Instant startOf(LocalDate date) {
        return date.atStartOfDay(zone).toInstant();
    }
}
