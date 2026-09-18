package hr.demo.vulkanizer.inventory;

import hr.demo.vulkanizer.auth.AppPrincipal;
import hr.demo.vulkanizer.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Skladište. Dostupno skladištaru i administratoru — ovdje se vidi nabavna
 * cijena i stvarno stanje, pa je uloga provjerena na razini cijelog kontrolera.
 */
@Tag(name = "Skladište")
@RestController
@RequestMapping("/api/warehouse")
@PreAuthorize("hasAnyRole('WAREHOUSE_WORKER', 'ADMIN')")
@Validated
class WarehouseController {

    private final InventoryFacade inventory;

    WarehouseController(InventoryFacade inventory) {
        this.inventory = inventory;
    }

    @Operation(summary = "Stanje zalihe s pretragom")
    @GetMapping("/products")
    PageResponse<ProductStockView> products(@RequestParam(required = false) String q,
                                            @RequestParam(required = false) String category,
                                            @RequestParam(defaultValue = "true") boolean onlyActive,
                                            @RequestParam(defaultValue = "0") @Min(0) int page,
                                            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        var result = inventory.searchForStaff(q, category, onlyActive,
                PageRequest.of(page, size, Sort.by("name").ascending()));
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Operation(summary = "Detalji artikla sa stanjem")
    @GetMapping("/products/{id}")
    ProductStockView product(@PathVariable Long id) {
        return inventory.getForStaff(id);
    }

    @Operation(summary = "Artikli ispod minimalne zalihe")
    @GetMapping("/low-stock")
    List<ProductStockView> lowStock() {
        return inventory.lowStock();
    }

    @Operation(summary = "Povijest prometa artikla")
    @GetMapping("/products/{id}/movements")
    PageResponse<StockMovementView> movements(@PathVariable Long id,
                                              @RequestParam(defaultValue = "0") @Min(0) int page,
                                              @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        var result = inventory.movements(id, PageRequest.of(page, size));
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Operation(summary = "Cjelokupna povijest prometa")
    @GetMapping("/movements")
    PageResponse<StockMovementView> allMovements(@RequestParam(defaultValue = "0") @Min(0) int page,
                                                 @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        var result = inventory.allMovements(PageRequest.of(page, size));
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Operation(summary = "Zaprimanje robe")
    @PostMapping("/stock/receive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void receive(@AuthenticationPrincipal AppPrincipal me, @Valid @RequestBody StockOperationRequest request) {
        inventory.receive(request.productId(), request.quantity(), request.note(), me.userId());
    }

    @Operation(summary = "Izdavanje robe")
    @PostMapping("/stock/issue")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void issue(@AuthenticationPrincipal AppPrincipal me, @Valid @RequestBody StockOperationRequest request) {
        inventory.issue(request.productId(), request.quantity(), request.note(), me.userId());
    }

    @Operation(summary = "Korekcija stanja nakon inventure")
    @PostMapping("/stock/adjust")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void adjust(@AuthenticationPrincipal AppPrincipal me, @Valid @RequestBody StockAdjustmentRequest request) {
        inventory.adjustTo(request.productId(), request.newQuantity(), request.note(), me.userId());
    }
}
