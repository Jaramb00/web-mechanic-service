package hr.demo.vulkanizer.catalog;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Usluge (admin)")
@RestController
@RequestMapping("/api/admin/services")
@PreAuthorize("hasRole('ADMIN')")
class AdminServiceController {

    private final ServiceCatalogFacade catalog;

    AdminServiceController(ServiceCatalogFacade catalog) {
        this.catalog = catalog;
    }

    @Operation(summary = "Popis svih usluga, uključujući neaktivne")
    @GetMapping
    List<ServiceView> list() {
        return catalog.listAll();
    }

    @Operation(summary = "Nova usluga")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ServiceView create(@Valid @RequestBody ServiceRequest request) {
        return catalog.create(request.name(), request.description(), request.price(),
                request.durationMinutes(), request.active(), request.sortOrder());
    }

    @Operation(summary = "Izmjena usluge")
    @PutMapping("/{id}")
    ServiceView update(@PathVariable Long id, @Valid @RequestBody ServiceRequest request) {
        return catalog.update(id, request.name(), request.description(), request.price(),
                request.durationMinutes(), request.active(), request.sortOrder());
    }

    @Operation(summary = "Deaktivacija usluge (zapis se ne briše zbog povijesnih termina)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deactivate(@PathVariable Long id) {
        catalog.deactivate(id);
    }
}
