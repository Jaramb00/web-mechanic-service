package hr.demo.vulkanizer.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Javni ulaz u `inventory`.
 *
 * Modul ne zna ništa o terminima ni rezervacijama — razlog promjene stiže kao
 * {@link StockRef}, čime je izbjegnuta kružna ovisnost među modulima.
 */
public interface InventoryFacade {

    // --- čitanje -------------------------------------------------------------

    Page<ProductView> searchPublic(String query, String categoryCode, Pageable pageable);

    Page<ProductStockView> searchForStaff(String query, String categoryCode, boolean onlyActive, Pageable pageable);

    ProductView getPublic(Long productId);

    ProductStockView getForStaff(Long productId);

    List<CategoryView> listCategories();

    List<ProductStockView> lowStock();

    long countLowStock();

    Page<StockMovementView> movements(Long productId, Pageable pageable);

    Page<StockMovementView> allMovements(Pageable pageable);

    // --- promjene stanja -----------------------------------------------------

    /** Diže rezerviranu količinu. Baca InsufficientStockException ako nema dovoljno. */
    void reserve(Long productId, int quantity, StockRef ref, Long actorId);

    /** Vraća rezerviranu količinu u raspoloživu. */
    void release(Long productId, int quantity, StockRef ref, Long actorId);

    /** Utrošak prethodno rezervirane robe. */
    void consumeReserved(Long productId, int quantity, StockRef ref, Long actorId);

    /** Utrošak robe koja nije bila rezervirana (uzeta s police tijekom servisa). */
    void consumeFree(Long productId, int quantity, StockRef ref, Long actorId);

    void receive(Long productId, int quantity, String note, Long actorId);

    /**
     * Storno prethodno evidentiranog utroška (npr. krivo unesena stavka naloga).
     * Vraća robu na policu i bilježi je kao korekciju, ne kao novu nabavu.
     */
    void revertUsage(Long productId, int quantity, StockRef ref, Long actorId, String note);

    void issue(Long productId, int quantity, String note, Long actorId);

    void adjustTo(Long productId, int newQuantity, String note, Long actorId);

    // --- šifrarnik artikala (admin) -----------------------------------------

    ProductStockView createProduct(ProductRequest request, Long actorId);

    ProductStockView updateProduct(Long productId, ProductRequest request, Long actorId);
}
