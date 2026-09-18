package hr.demo.vulkanizer.inventory;

import hr.demo.vulkanizer.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Javni katalog artikala. Dostupan bez prijave, ali vraća isključivo
 * {@link ProductView} — bez nabavne cijene i bez internog stanja skladišta.
 */
@Tag(name = "Artikli (javno)")
@RestController
@Validated
class ProductController {

    private final InventoryFacade inventory;

    ProductController(InventoryFacade inventory) {
        this.inventory = inventory;
    }

    @Operation(summary = "Pretraga artikala s paginacijom")
    @GetMapping("/api/products")
    PageResponse<ProductView> search(@RequestParam(required = false) String q,
                                     @RequestParam(required = false) String category,
                                     @RequestParam(defaultValue = "0") @Min(0) int page,
                                     @RequestParam(defaultValue = "12") @Min(1) @Max(60) int size) {
        var pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        var result = inventory.searchPublic(q, category, pageable);
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Operation(summary = "Jedan artikl")
    @GetMapping("/api/products/{id}")
    ProductView get(@PathVariable Long id) {
        return inventory.getPublic(id);
    }

    @Operation(summary = "Kategorije artikala")
    @GetMapping("/api/product-categories")
    List<CategoryView> categories() {
        return inventory.listCategories();
    }
}
