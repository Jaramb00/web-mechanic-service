package hr.demo.vulkanizer.common.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Revizijski trag za promjene koje moraju ostati objašnjive — u demou prije
 * svega promjene zalihe.
 *
 * Namjerno se piše u istoj transakciji kao i sama promjena: ako se promjena
 * poništi, ne smije ostati zapis da se dogodila.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository repository;
    private final ObjectMapper objectMapper;

    AuditService(AuditLogRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(Long actorId, String entityType, Long entityId, String action, Map<String, ?> details) {
        repository.save(new AuditLog(actorId, entityType, entityId, action, toJson(details)));
    }

    private String toJson(Map<String, ?> details) {
        if (details == null || details.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(details);
        } catch (JsonProcessingException e) {
            // Neuspjela serijalizacija detalja ne smije srušiti poslovnu radnju.
            log.warn("Detalji revizijskog zapisa nisu serijalizirani", e);
            return null;
        }
    }
}
