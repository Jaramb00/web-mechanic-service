package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import hr.demo.vulkanizer.config.AppProperties;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
public class AppointmentQueryService {

    private final AppointmentRepository appointments;
    private final AppointmentAssembler assembler;
    private final ZoneId zone;

    AppointmentQueryService(AppointmentRepository appointments, AppointmentAssembler assembler,
                            AppProperties properties) {
        this.appointments = appointments;
        this.assembler = assembler;
        this.zone = properties.booking().zone();
    }

    /**
     * Termin kupca. Vlasnik je dio upita — tuđi termin vraća 404, ne 403, da se
     * ne otkriva ni postojanje zapisa.
     */
    @Transactional(readOnly = true)
    public AppointmentView getForCustomer(Long appointmentId, Long customerId) {
        return appointments.findByIdAndCustomerId(appointmentId, customerId)
                .map(assembler::toViewForCustomer)
                .orElseThrow(() -> new NotFoundException("Termin nije pronađen."));
    }

    @Transactional(readOnly = true)
    public Page<AppointmentView> listForCustomer(Long customerId, Pageable pageable) {
        return appointments.findByCustomerIdOrderByStartAtDesc(customerId, pageable)
                .map(assembler::toViewForCustomer);
    }

    @Transactional(readOnly = true)
    public AppointmentView getForStaff(Long appointmentId) {
        return appointments.findById(appointmentId)
                .map(assembler::toViewForStaff)
                .orElseThrow(() -> new NotFoundException("Termin nije pronađen."));
    }

    @Transactional(readOnly = true)
    public List<AppointmentView> listForDay(LocalDate date) {
        Instant from = date.atStartOfDay(zone).toInstant();
        Instant to = date.plusDays(1).atStartOfDay(zone).toInstant();
        return assembler.toViewsForStaff(appointments.findInRange(from, to));
    }

    @Transactional(readOnly = true)
    public Page<AppointmentView> listForStaff(AppointmentStatus status, LocalDate from, LocalDate to, Pageable pageable) {
        Instant fromInstant = from == null ? null : from.atStartOfDay(zone).toInstant();
        Instant toInstant = to == null ? null : to.plusDays(1).atStartOfDay(zone).toInstant();
        return appointments.findForStaff(status, fromInstant, toInstant, pageable)
                .map(assembler::toViewForStaff);
    }
}
