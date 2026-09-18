package hr.demo.vulkanizer.inventory;

import hr.demo.vulkanizer.auth.AppPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Artikli (admin)")
@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
class AdminProductController {

    private final InventoryFacade inventory;

    AdminProductController(InventoryFacade inventory) {
        this.inventory = inventory;
    }

    @Operation(summary = "Novi artikl")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ProductStockView create(@AuthenticationPrincipal AppPrincipal me, @Valid @RequestBody ProductRequest request) {
        return inventory.createProduct(request, me.userId());
    }

    @Operation(summary = "Izmjena artikla (bez izravne izmjene količine)")
    @PutMapping("/{id}")
    ProductStockView update(@AuthenticationPrincipal AppPrincipal me, @PathVariable Long id,
                            @Valid @RequestBody ProductRequest request) {
        return inventory.updateProduct(id, request, me.userId());
    }
}
