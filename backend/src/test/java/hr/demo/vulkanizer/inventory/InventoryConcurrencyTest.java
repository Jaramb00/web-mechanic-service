package hr.demo.vulkanizer.inventory;

import hr.demo.vulkanizer.common.error.DomainExceptions.InsufficientStockException;
import hr.demo.vulkanizer.inventory.InventoryFacade;
import hr.demo.vulkanizer.inventory.ProductStockView;
import hr.demo.vulkanizer.reservations.ReservationRequest;
import hr.demo.vulkanizer.reservations.ReservationService;
import hr.demo.vulkanizer.support.AbstractIntegrationTest;
import hr.demo.vulkanizer.users.UserView;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Zaliha se ne smije "prodati" ispod nule ni pod paralelnim opterećenjem, a
 * stanje mora u svakom trenutku odgovarati knjizi prometa.
 */
class InventoryConcurrencyTest extends AbstractIntegrationTest {

    @Autowired
    private InventoryFacade inventory;

    @Autowired
    private ReservationService reservations;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    @DisplayName("Paralelne rezervacije ne mogu rezervirati više nego što je raspoloživo")
    void concurrentReservationsCannotOversell() throws Exception {
        ProductStockView product = product("TEST-LIMITED");
        int available = product.availableQuantity();
        int extraUnits = 7;
        // Dovodi artikl na točno poznatu raspoloživu količinu.
        inventory.receive(product.id(), extraUnits, "Priprema testa", null);
        int target = available + extraUnits;

        int attempts = target + 5;   // više pokušaja nego što ima robe
        List<UserView> customers = new ArrayList<>();
        for (int i = 0; i < attempts; i++) {
            customers.add(fixtures.customer());
        }

        AtomicInteger reserved = new AtomicInteger();
        AtomicInteger rejected = new AtomicInteger();
        List<Throwable> unexpected = Collections.synchronizedList(new ArrayList<>());
        CountDownLatch gate = new CountDownLatch(1);

        List<Callable<Void>> tasks = new ArrayList<>();
        for (int i = 0; i < attempts; i++) {
            final int index = i;
            tasks.add(() -> {
                gate.await();
                try {
                    reservations.create(customers.get(index).id(),
                            new ReservationRequest(product.id(), 1, null, null));
                    reserved.incrementAndGet();
                } catch (InsufficientStockException e) {
                    rejected.incrementAndGet();
                } catch (Throwable t) {
                    unexpected.add(t);
                }
                return null;
            });
        }

        try (ExecutorService pool = Executors.newFixedThreadPool(attempts)) {
            List<Future<Void>> futures = tasks.stream().map(pool::submit).toList();
            gate.countDown();
            for (Future<Void> future : futures) {
                future.get(30, TimeUnit.SECONDS);
            }
        }

        assertThat(unexpected).as("neočekivane greške tijekom paralelnih rezervacija").isEmpty();
        assertThat(reserved.get()).as("uspješnih rezervacija").isEqualTo(target);
        assertThat(rejected.get()).as("odbijenih rezervacija").isEqualTo(attempts - target);

        ProductStockView after = inventory.getForStaff(product.id());
        assertThat(after.availableQuantity()).as("raspoloživo nikad ne smije pasti ispod nule").isZero();
        assertThat(after.reservedQuantity()).isLessThanOrEqualTo(after.physicalQuantity());
    }

    @Test
    @DisplayName("Stanje svakog artikla odgovara zbroju knjige prometa")
    void stockMatchesMovementLedger() {
        ProductStockView product = product("TEST-PLENTY");
        inventory.receive(product.id(), 25, "Primka za test invarijante", null);
        inventory.issue(product.id(), 4, "Izdatnica za test invarijante", null);
        inventory.adjustTo(product.id(), inventory.getForStaff(product.id()).physicalQuantity() - 1,
                "Korekcija za test invarijante", null);

        // Ovo je invarijanta koja mora vrijediti za cijelu bazu, ne samo za ovaj
        // artikl: svaka promjena količine mora imati zapis u knjizi prometa.
        Integer mismatched = jdbc.queryForObject("""
                SELECT count(*) FROM products p WHERE
                    p.physical_quantity <> COALESCE((SELECT SUM(delta_physical) FROM stock_movements WHERE product_id = p.id), 0)
                 OR p.reserved_quantity <> COALESCE((SELECT SUM(delta_reserved) FROM stock_movements WHERE product_id = p.id), 0)
                """, Integer.class);

        assertThat(mismatched).as("artikala čije stanje ne odgovara knjizi prometa").isZero();
    }

    @Test
    @DisplayName("Korekcija ispod već rezervirane količine se odbija")
    void adjustmentBelowReservedIsRejected() {
        ProductStockView product = product("TEST-PLENTY");
        inventory.receive(product.id(), 10, "Priprema", null);
        UserView customer = fixtures.customer();
        reservations.create(customer.id(), new ReservationRequest(product.id(), 5, null, null));

        ProductStockView current = inventory.getForStaff(product.id());
        int belowReserved = current.reservedQuantity() - 1;

        org.assertj.core.api.Assertions.assertThatThrownBy(
                        () -> inventory.adjustTo(product.id(), belowReserved, "Nedopuštena korekcija", null))
                .isInstanceOf(hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException.class);
    }

    private ProductStockView product(String sku) {
        return inventory.searchForStaff(sku, null, true, PageRequest.of(0, 1)).getContent().getFirst();
    }
}
