package hr.demo.vulkanizer.catalog;

import hr.demo.vulkanizer.common.error.DomainExceptions.ConflictException;
import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
class ServiceCatalogFacadeImpl implements ServiceCatalogFacade {

    private final ServiceOfferingRepository repository;

    ServiceCatalogFacadeImpl(ServiceOfferingRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceView> listActive() {
        return repository.findByActiveTrueOrderBySortOrderAscNameAsc().stream().map(ServiceCatalogFacadeImpl::toView).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceView> listAll() {
        return repository.findAllByOrderBySortOrderAscNameAsc().stream().map(ServiceCatalogFacadeImpl::toView).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceView getById(Long id) {
        return toView(require(id));
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceView getBookable(Long id) {
        return repository.findByIdAndActiveTrue(id)
                .map(ServiceCatalogFacadeImpl::toView)
                .orElseThrow(() -> new NotFoundException("Usluga nije dostupna za rezervaciju."));
    }

    @Override
    @Transactional
    public ServiceView create(String name, String description, BigDecimal price, int durationMinutes, boolean active, int sortOrder) {
        if (repository.existsByNameIgnoreCase(name.trim())) {
            throw new ConflictException("Usluga s tim nazivom već postoji.");
        }
        return toView(repository.save(new ServiceOffering(name.trim(), description, price, durationMinutes, active, sortOrder)));
    }

    @Override
    @Transactional
    public ServiceView update(Long id, String name, String description, BigDecimal price, int durationMinutes, boolean active, int sortOrder) {
        ServiceOffering entity = require(id);
        entity.update(name.trim(), description, price, durationMinutes, active, sortOrder);
        return toView(entity);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        // Usluga se nikad ne briše: povijesni termini je referenciraju.
        ServiceOffering entity = require(id);
        entity.update(entity.getName(), entity.getDescription(), entity.getPrice(),
                entity.getDurationMinutes(), false, entity.getSortOrder());
    }

    private ServiceOffering require(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Usluga nije pronađena."));
    }

    private static ServiceView toView(ServiceOffering s) {
        return new ServiceView(s.getId(), s.getName(), s.getDescription(), s.getPrice(),
                s.getDurationMinutes(), s.isActive(), s.getSortOrder());
    }
}
