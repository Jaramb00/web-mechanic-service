package hr.demo.vulkanizer.inventory;

import hr.demo.vulkanizer.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Artikl.
 *
 * Količine se NIKAD ne mijenjaju kroz settere na ovom entitetu — mijenjaju se
 * isključivo uvjetnim UPDATE-ovima u {@link ProductRepository}, koji u istoj
 * naredbi provjeravaju da rezultat ostaje ispravan. Time nema prozora između
 * čitanja i pisanja u kojem dvije paralelne rezervacije mogu obje proći.
 */
@Getter
@Entity
@Table(name = "products")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class Product extends BaseEntity {

    @Column(nullable = false, unique = true, length = 64)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 120)
    private String manufacturer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private ProductCategory category;

    @Column(length = 2000)
    private String description;

    @Column(name = "tire_size", length = 40)
    private String tireSize;

    @Column(name = "sale_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal salePrice;

    /** Nabavna cijena — poslovno osjetljiv podatak, ne izlazi na javni API. */
    @Column(name = "purchase_price", precision = 12, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "physical_quantity", nullable = false)
    private int physicalQuantity;

    @Column(name = "reserved_quantity", nullable = false)
    private int reservedQuantity;

    @Column(name = "min_quantity", nullable = false)
    private int minQuantity;

    @Column(nullable = false)
    private boolean active = true;

    Product(String sku, String name, String manufacturer, ProductCategory category, String description,
            String tireSize, BigDecimal salePrice, BigDecimal purchasePrice, int minQuantity, boolean active) {
        this.sku = sku;
        updateDetails(name, manufacturer, category, description, tireSize, salePrice, purchasePrice, minQuantity, active);
    }

    /** Mijenja samo opisna polja. Količine ovdje namjerno nisu dostupne. */
    final void updateDetails(String name, String manufacturer, ProductCategory category, String description,
                             String tireSize, BigDecimal salePrice, BigDecimal purchasePrice,
                             int minQuantity, boolean active) {
        this.name = name;
        this.manufacturer = manufacturer;
        this.category = category;
        this.description = description;
        this.tireSize = tireSize;
        this.salePrice = salePrice;
        this.purchasePrice = purchasePrice;
        this.minQuantity = minQuantity;
        this.active = active;
    }

    int availableQuantity() {
        return physicalQuantity - reservedQuantity;
    }

    boolean isLowStock() {
        return availableQuantity() < minQuantity;
    }
}
