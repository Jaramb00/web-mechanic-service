package hr.demo.vulkanizer.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByIdAndActiveTrue(Long id);

    boolean existsBySkuIgnoreCase(String sku);

    /**
     * Prazan string umjesto null-a je namjeran: PostgreSQL ne može zaključiti
     * tip NULL parametra unutar concat/LIKE izraza i javlja
     * "function lower(bytea) does not exist". Prazan uzorak ionako odgovara svemu.
     */
    @Query("""
            SELECT p FROM Product p JOIN FETCH p.category c
            WHERE (:onlyActive = false OR p.active = true)
              AND (:categoryCode = '' OR c.code = :categoryCode)
              AND (:q = '' OR lower(p.name) LIKE lower(concat('%', :q, '%'))
                           OR lower(p.sku)  LIKE lower(concat('%', :q, '%'))
                           OR lower(coalesce(p.tireSize, '')) LIKE lower(concat('%', :q, '%')))
            """)
    Page<Product> search(@Param("q") String q,
                         @Param("categoryCode") String categoryCode,
                         @Param("onlyActive") boolean onlyActive,
                         Pageable pageable);

    @Query("SELECT p FROM Product p JOIN FETCH p.category WHERE p.active = true AND (p.physicalQuantity - p.reservedQuantity) < p.minQuantity ORDER BY p.name")
    List<Product> findLowStock();

    @Query("SELECT count(p) FROM Product p WHERE p.active = true AND (p.physicalQuantity - p.reservedQuantity) < p.minQuantity")
    long countLowStock();

    // ---------------------------------------------------------------------
    //  Uvjetne izmjene količina.
    //
    //  Svaka je jedna atomarna naredba: uvjet i izmjena se ocjenjuju zajedno,
    //  pod redčanim lokotom baze. Ako uvjet ne prolazi, promijenjeno je 0 redaka
    //  i servis to tumači kao odbijanje — bez ponovnog pokušaja i bez prozora
    //  u kojem bi dvije paralelne transakcije obje prošle.
    // ---------------------------------------------------------------------

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE products
               SET reserved_quantity = reserved_quantity + :qty, updated_at = now()
             WHERE id = :id
               AND active = true
               AND physical_quantity - reserved_quantity >= :qty
            """, nativeQuery = true)
    int tryReserve(@Param("id") Long id, @Param("qty") int qty);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE products
               SET reserved_quantity = reserved_quantity - :qty, updated_at = now()
             WHERE id = :id
               AND reserved_quantity >= :qty
            """, nativeQuery = true)
    int tryRelease(@Param("id") Long id, @Param("qty") int qty);

    /** Utrošak rezervirane robe: skida se i s police i s rezervacije odjednom. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE products
               SET physical_quantity = physical_quantity - :qty,
                   reserved_quantity = reserved_quantity - :qty,
                   updated_at = now()
             WHERE id = :id
               AND reserved_quantity >= :qty
               AND physical_quantity >= :qty
            """, nativeQuery = true)
    int tryConsumeReserved(@Param("id") Long id, @Param("qty") int qty);

    /** Utrošak nerezervirane robe (majstor uzme s police tijekom servisa). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE products
               SET physical_quantity = physical_quantity - :qty, updated_at = now()
             WHERE id = :id
               AND physical_quantity - reserved_quantity >= :qty
            """, nativeQuery = true)
    int tryConsumeFree(@Param("id") Long id, @Param("qty") int qty);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE products
               SET physical_quantity = physical_quantity + :qty, updated_at = now()
             WHERE id = :id
            """, nativeQuery = true)
    int receive(@Param("id") Long id, @Param("qty") int qty);

    /**
     * Korekcija na točan iznos. Odbija se ako bi novo stanje palo ispod već
     * rezervirane količine — inače bi rezervacije postale nepokrivene.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE products
               SET physical_quantity = :newQuantity, updated_at = now()
             WHERE id = :id
               AND :newQuantity >= reserved_quantity
               AND :newQuantity >= 0
            """, nativeQuery = true)
    int adjustTo(@Param("id") Long id, @Param("newQuantity") int newQuantity);
}
