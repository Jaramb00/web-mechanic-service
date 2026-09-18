package hr.demo.vulkanizer.inventory;

import hr.demo.vulkanizer.common.audit.AuditService;
import hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException;
import hr.demo.vulkanizer.common.error.DomainExceptions.InsufficientStockException;
import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

@Service
class InventoryFacadeImpl implements InventoryFacade {

    private final ProductRepository products;
    private final StockMovementRepository movements;
    private final ProductCategoryRepository categories;
    private final AuditService audit;
    private final ApplicationEventPublisher events;

    InventoryFacadeImpl(ProductRepository products, StockMovementRepository movements,
                        ProductCategoryRepository categories, AuditService audit,
                        ApplicationEventPublisher events) {
        this.products = products;
        this.movements = movements;
        this.categories = categories;
        this.audit = audit;
        this.events = events;
    }

    // -------------------------------------------------------------------------
    //  Čitanje
    // -------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public Page<ProductView> searchPublic(String query, String categoryCode, Pageable pageable) {
        return products.search(blankIfNull(query), blankIfNull(categoryCode), true, pageable)
                .map(InventoryFacadeImpl::toPublicView);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductStockView> searchForStaff(String query, String categoryCode, boolean onlyActive, Pageable pageable) {
        return products.search(blankIfNull(query), blankIfNull(categoryCode), onlyActive, pageable)
                .map(InventoryFacadeImpl::toStockView);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductView getPublic(Long productId) {
        return toPublicView(products.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> new NotFoundException("Artikl nije pronađen.")));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductStockView getForStaff(Long productId) {
        return toStockView(require(productId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryView> listCategories() {
        return categories.findAllByOrderByNameAsc().stream()
                .map(c -> new CategoryView(c.getId(), c.getCode(), c.getName())).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductStockView> lowStock() {
        return products.findLowStock().stream().map(InventoryFacadeImpl::toStockView).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long countLowStock() {
        return products.countLowStock();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StockMovementView> movements(Long productId, Pageable pageable) {
        Product product = require(productId);
        return movements.findByProductIdOrderByCreatedAtDescIdDesc(productId, pageable)
                .map(m -> toMovementView(m, product.getSku(), product.getName()));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StockMovementView> allMovements(Pageable pageable) {
        return movements.findAllByOrderByCreatedAtDescIdDesc(pageable).map(m -> {
            Product p = products.findById(m.getProductId()).orElse(null);
            return toMovementView(m, p == null ? null : p.getSku(), p == null ? null : p.getName());
        });
    }

    // -------------------------------------------------------------------------
    //  Promjene stanja — sve idu po istom obrascu:
    //  uvjetni UPDATE → provjera broja promijenjenih redaka → zapis u knjigu prometa.
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    public void reserve(Long productId, int quantity, StockRef ref, Long actorId) {
        requirePositive(quantity);
        Product product = require(productId);
        if (products.tryReserve(productId, quantity) == 0) {
            throw new InsufficientStockException(
                    "Nema dovoljno raspoložive količine artikla \"" + product.getName() + "\".");
        }
        record(productId, MovementType.RESERVATION, 0, quantity, ref, actorId, null);
        publishLowStockIfNeeded(productId);
    }

    @Override
    @Transactional
    public void release(Long productId, int quantity, StockRef ref, Long actorId) {
        requirePositive(quantity);
        require(productId);
        if (products.tryRelease(productId, quantity) == 0) {
            throw new BusinessRuleException("Rezervirana količina je manja od tražene.");
        }
        record(productId, MovementType.RELEASE, 0, -quantity, ref, actorId, null);
    }

    @Override
    @Transactional
    public void consumeReserved(Long productId, int quantity, StockRef ref, Long actorId) {
        requirePositive(quantity);
        Product product = require(productId);
        if (products.tryConsumeReserved(productId, quantity) == 0) {
            throw new InsufficientStockException(
                    "Rezervirana količina artikla \"" + product.getName() + "\" ne pokriva traženi utrošak.");
        }
        record(productId, MovementType.SERVICE_USAGE, -quantity, -quantity, ref, actorId, null);
        publishLowStockIfNeeded(productId);
    }

    @Override
    @Transactional
    public void consumeFree(Long productId, int quantity, StockRef ref, Long actorId) {
        requirePositive(quantity);
        Product product = require(productId);
        if (products.tryConsumeFree(productId, quantity) == 0) {
            throw new InsufficientStockException(
                    "Nema dovoljno raspoložive količine artikla \"" + product.getName() + "\".");
        }
        record(productId, MovementType.SERVICE_USAGE, -quantity, 0, ref, actorId, null);
        publishLowStockIfNeeded(productId);
    }

    @Override
    @Transactional
    public void receive(Long productId, int quantity, String note, Long actorId) {
        requirePositive(quantity);
        require(productId);
        products.receive(productId, quantity);
        record(productId, MovementType.PURCHASE, quantity, 0, StockRef.none(), actorId, note);
        audit.record(actorId, "PRODUCT", productId, "STOCK_RECEIVE", Map.of("quantity", quantity));
    }

    @Override
    @Transactional
    public void revertUsage(Long productId, int quantity, StockRef ref, Long actorId, String note) {
        requirePositive(quantity);
        require(productId);
        products.receive(productId, quantity);
        record(productId, MovementType.ADJUSTMENT, quantity, 0, ref, actorId,
                note == null ? "Storno utroška" : note);
        audit.record(actorId, "PRODUCT", productId, "STOCK_REVERT_USAGE", Map.of("quantity", quantity));
    }

    @Override
    @Transactional
    public void issue(Long productId, int quantity, String note, Long actorId) {
        requirePositive(quantity);
        Product product = require(productId);
        if (products.tryConsumeFree(productId, quantity) == 0) {
            throw new InsufficientStockException(
                    "Nema dovoljno raspoložive količine artikla \"" + product.getName() + "\".");
        }
        record(productId, MovementType.ADJUSTMENT, -quantity, 0, StockRef.none(), actorId, note);
        audit.record(actorId, "PRODUCT", productId, "STOCK_ISSUE", Map.of("quantity", quantity));
        publishLowStockIfNeeded(productId);
    }

    @Override
    @Transactional
    public void adjustTo(Long productId, int newQuantity, String note, Long actorId) {
        if (newQuantity < 0) {
            throw new BusinessRuleException("Količina ne može biti negativna.");
        }
        Product product = require(productId);
        int previous = product.getPhysicalQuantity();
        if (previous == newQuantity) {
            return;
        }
        if (products.adjustTo(productId, newQuantity) == 0) {
            throw new BusinessRuleException(
                    "Korekcija je odbijena: novo stanje bi bilo manje od već rezervirane količine ("
                            + product.getReservedQuantity() + ").");
        }
        record(productId, MovementType.ADJUSTMENT, newQuantity - previous, 0, StockRef.none(), actorId, note);
        audit.record(actorId, "PRODUCT", productId, "STOCK_ADJUST",
                Map.of("from", previous, "to", newQuantity, "note", note == null ? "" : note));
        publishLowStockIfNeeded(productId);
    }

    // -------------------------------------------------------------------------
    //  Šifrarnik artikala
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    public ProductStockView createProduct(ProductRequest request, Long actorId) {
        String sku = request.sku().trim().toUpperCase();
        if (products.existsBySkuIgnoreCase(sku)) {
            throw new hr.demo.vulkanizer.common.error.DomainExceptions.ConflictException(
                    "Artikl sa šifrom " + sku + " već postoji.");
        }
        ProductCategory category = requireCategory(request.categoryCode());
        Product product = products.save(new Product(sku, request.name().trim(), trimToNull(request.manufacturer()),
                category, trimToNull(request.description()), trimToNull(request.tireSize()),
                request.salePrice(), request.purchasePrice(), request.minQuantity(), request.active()));

        // Početno stanje je promjena kao i svaka druga — ide kroz knjigu prometa.
        if (request.initialQuantity() != null && request.initialQuantity() > 0) {
            products.receive(product.getId(), request.initialQuantity());
            record(product.getId(), MovementType.INITIAL_STOCK, request.initialQuantity(), 0,
                    StockRef.none(), actorId, "Početno stanje pri unosu artikla");
        }
        audit.record(actorId, "PRODUCT", product.getId(), "PRODUCT_CREATE", Map.of("sku", sku));
        return toStockView(require(product.getId()));
    }

    @Override
    @Transactional
    public ProductStockView updateProduct(Long productId, ProductRequest request, Long actorId) {
        Product product = require(productId);
        product.updateDetails(request.name().trim(), trimToNull(request.manufacturer()),
                requireCategory(request.categoryCode()), trimToNull(request.description()),
                trimToNull(request.tireSize()), request.salePrice(), request.purchasePrice(),
                request.minQuantity(), request.active());
        audit.record(actorId, "PRODUCT", productId, "PRODUCT_UPDATE", Map.of("sku", product.getSku()));
        return toStockView(product);
    }

    private ProductCategory requireCategory(String code) {
        return categories.findByCode(code)
                .orElseThrow(() -> new BusinessRuleException("Nepoznata kategorija artikla."));
    }

    // -------------------------------------------------------------------------

    private void record(Long productId, MovementType type, int deltaPhysical, int deltaReserved,
                        StockRef ref, Long actorId, String note) {
        movements.save(new StockMovement(productId, type, deltaPhysical, deltaReserved, ref, actorId, trimToNull(note)));
    }

    /**
     * Obavijest o niskoj zalihi ide kao događaj — `inventory` ne zna tko je
     * sluša niti mora znati za `notifications`.
     */
    private void publishLowStockIfNeeded(Long productId) {
        products.findById(productId)
                .filter(Product::isLowStock)
                .ifPresent(p -> events.publishEvent(new LowStockEvent(
                        p.getId(), p.getSku(), p.getName(), p.availableQuantity(), p.getMinQuantity())));
    }

    private Product require(Long productId) {
        return products.findById(productId)
                .orElseThrow(() -> new NotFoundException("Artikl nije pronađen."));
    }

    private static void requirePositive(int quantity) {
        if (quantity <= 0) {
            throw new BusinessRuleException("Količina mora biti veća od nule.");
        }
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    /** Vidi komentar uz {@code ProductRepository.search}. */
    private static String blankIfNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : "";
    }

    static ProductView toPublicView(Product p) {
        return new ProductView(p.getId(), p.getSku(), p.getName(), p.getManufacturer(),
                p.getCategory().getCode(), p.getCategory().getName(), p.getDescription(), p.getTireSize(),
                p.getSalePrice(), p.availableQuantity(), p.isActive());
    }

    static ProductStockView toStockView(Product p) {
        return new ProductStockView(p.getId(), p.getSku(), p.getName(), p.getManufacturer(),
                p.getCategory().getCode(), p.getCategory().getName(), p.getDescription(), p.getTireSize(),
                p.getSalePrice(), p.getPurchasePrice(), p.getPhysicalQuantity(), p.getReservedQuantity(),
                p.availableQuantity(), p.getMinQuantity(), p.isLowStock(), p.isActive());
    }

    static StockMovementView toMovementView(StockMovement m, String sku, String name) {
        return new StockMovementView(m.getId(), m.getProductId(), sku, name, m.getMovementType(),
                m.getDeltaPhysical(), m.getDeltaReserved(), m.getReferenceType(), m.getReferenceId(),
                m.getCreatedBy(), m.getNote(), m.getCreatedAt());
    }
}
