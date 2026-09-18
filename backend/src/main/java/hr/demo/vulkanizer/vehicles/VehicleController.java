package hr.demo.vulkanizer.vehicles;

import hr.demo.vulkanizer.auth.AppPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

/**
 * Vozila prijavljenog korisnika. Svaka operacija ide kroz vlasnika iz
 * sigurnosnog konteksta — id iz putanje sam po sebi ne daje pristup.
 */
@Tag(name = "Moja vozila")
@RestController
@RequestMapping("/api/me/vehicles")
@PreAuthorize("hasRole('CUSTOMER')")
class VehicleController {

    private final VehicleFacade vehicles;

    VehicleController(VehicleFacade vehicles) {
        this.vehicles = vehicles;
    }

    @Operation(summary = "Popis mojih vozila")
    @GetMapping
    List<VehicleView> list(@AuthenticationPrincipal AppPrincipal me) {
        return vehicles.listForOwner(me.userId());
    }

    @Operation(summary = "Jedno moje vozilo")
    @GetMapping("/{id}")
    VehicleView get(@AuthenticationPrincipal AppPrincipal me, @PathVariable Long id) {
        return vehicles.getOwned(id, me.userId());
    }

    @Operation(summary = "Dodavanje vozila")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    VehicleView create(@AuthenticationPrincipal AppPrincipal me, @Valid @RequestBody VehicleRequest request) {
        return vehicles.create(me.userId(), request);
    }

    @Operation(summary = "Izmjena vozila")
    @PutMapping("/{id}")
    VehicleView update(@AuthenticationPrincipal AppPrincipal me, @PathVariable Long id,
                       @Valid @RequestBody VehicleRequest request) {
        return vehicles.update(id, me.userId(), request);
    }

    @Operation(summary = "Brisanje vozila")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@AuthenticationPrincipal AppPrincipal me, @PathVariable Long id) {
        vehicles.delete(id, me.userId());
    }
}
