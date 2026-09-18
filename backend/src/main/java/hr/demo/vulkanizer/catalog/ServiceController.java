package hr.demo.vulkanizer.catalog;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Javni cjenik — dostupan bez prijave, jer ga prikazuje javna stranica. */
@Tag(name = "Usluge (javno)")
@RestController
@RequestMapping("/api/services")
class ServiceController {

    private final ServiceCatalogFacade catalog;

    ServiceController(ServiceCatalogFacade catalog) {
        this.catalog = catalog;
    }

    @Operation(summary = "Popis aktivnih usluga s cijenama")
    @GetMapping
    List<ServiceView> list() {
        return catalog.listActive();
    }

    @Operation(summary = "Jedna usluga")
    @GetMapping("/{id}")
    ServiceView get(@PathVariable Long id) {
        return catalog.getBookable(id);
    }
}
