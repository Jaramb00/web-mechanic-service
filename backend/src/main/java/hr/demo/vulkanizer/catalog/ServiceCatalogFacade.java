package hr.demo.vulkanizer.catalog;

import java.math.BigDecimal;
import java.util.List;

/** Javni ulaz u katalog usluga. */
public interface ServiceCatalogFacade {

    List<ServiceView> listActive();

    List<ServiceView> listAll();

    ServiceView getById(Long id);

    /** Aktivna usluga — jedina koja se smije rezervirati. */
    ServiceView getBookable(Long id);

    ServiceView create(String name, String description, BigDecimal price, int durationMinutes, boolean active, int sortOrder);

    ServiceView update(Long id, String name, String description, BigDecimal price, int durationMinutes, boolean active, int sortOrder);

    void deactivate(Long id);
}
