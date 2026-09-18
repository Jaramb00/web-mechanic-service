package hr.demo.vulkanizer.appointments;

import hr.demo.vulkanizer.appointments.dto.WorkingHoursRequest;
import hr.demo.vulkanizer.appointments.dto.WorkingHoursView;
import hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException;
import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WorkingHoursService {

    private final WorkingHoursRepository repository;

    WorkingHoursService(WorkingHoursRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<WorkingHoursView> list() {
        return repository.findAllByOrderByDayOfWeekAsc().stream()
                .map(w -> new WorkingHoursView(w.getDayOfWeek(), w.getOpenTime(), w.getCloseTime(), w.isClosed()))
                .toList();
    }

    @Transactional
    public WorkingHoursView update(WorkingHoursRequest request) {
        if (!request.closed()) {
            if (request.openTime() == null || request.closeTime() == null) {
                throw new BusinessRuleException("Za radni dan je potrebno upisati vrijeme otvaranja i zatvaranja.");
            }
            if (!request.closeTime().isAfter(request.openTime())) {
                throw new BusinessRuleException("Vrijeme zatvaranja mora biti nakon vremena otvaranja.");
            }
        }
        WorkingHours entity = repository.findByDayOfWeek(request.dayOfWeek())
                .orElseThrow(() -> new NotFoundException("Dan nije pronađen."));
        entity.update(request.openTime(), request.closeTime(), request.closed());
        return new WorkingHoursView(entity.getDayOfWeek(), entity.getOpenTime(), entity.getCloseTime(), entity.isClosed());
    }
}
