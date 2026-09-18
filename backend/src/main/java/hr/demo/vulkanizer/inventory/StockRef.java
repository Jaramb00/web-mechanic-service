package hr.demo.vulkanizer.inventory;

/**
 * Referenca na razlog promjene zalihe, npr. ("RESERVATION", 42) ili
 * ("APPOINTMENT", 17).
 *
 * Namjerno je nestrukturirana: da `inventory` ne bi morao ovisiti o modulima
 * `reservations` i `appointments` i time stvoriti kružnu ovisnost.
 */
public record StockRef(String type, Long id) {

    public static StockRef of(String type, Long id) {
        return new StockRef(type, id);
    }

    public static StockRef none() {
        return new StockRef(null, null);
    }
}
