package hr.demo.vulkanizer.inventory;

import hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException;
import hr.demo.vulkanizer.common.error.DomainExceptions.InsufficientStockException;
import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import hr.demo.vulkanizer.inventory.InventoryFacade;
import hr.demo.vulkanizer.inventory.ProductStockView;
import hr.demo.vulkanizer.reservations.ReservationRequest;
import hr.demo.vulkanizer.reservations.ReservationService;
import hr.demo.vulkanizer.reservations.ReservationStatus;
import hr.demo.vulkanizer.reservations.ReservationView;
import hr.demo.vulkanizer.support.AbstractIntegrationTest;
import hr.demo.vulkanizer.users.UserView;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReservationLifecycleTest extends AbstractIntegrationTest {

    @Autowired
    private ReservationService reservations;

    @Autowired
    private InventoryFacade inventory;

    @Test
    @DisplayName("Rezervacija diže rezerviranu količinu, ali ne dira fizičko stanje")
    void reservingHoldsStockWithoutRemovingIt() {
        ProductStockView before = stocked();
        UserView customer = fixtures.customer();

        reservations.create(customer.id(), new ReservationRequest(before.id(), 3, null, null));

        ProductStockView after = inventory.getForStaff(before.id());
        assertThat(after.physicalQuantity()).isEqualTo(before.physicalQuantity());
        assertThat(after.reservedQuantity()).isEqualTo(before.reservedQuantity() + 3);
        assertThat(after.availableQuantity()).isEqualTo(before.availableQuantity() - 3);
    }

    @Test
    @DisplayName("Otkazivanje vraća robu u raspoloživu zalihu")
    void cancellingReleasesStock() {
        ProductStockView before = stocked();
        UserView customer = fixtures.customer();

        ReservationView reservation = reservations.create(customer.id(),
                new ReservationRequest(before.id(), 2, null, null));
        ReservationView cancelled = reservations.cancelAsCustomer(reservation.id(), customer.id());

        assertThat(cancelled.status()).isEqualTo(ReservationStatus.CANCELLED);
        assertThat(inventory.getForStaff(before.id()).availableQuantity())
                .isEqualTo(before.availableQuantity());
    }

    @Test
    @DisplayName("Izdavanje robe skida i fizičko stanje i rezervaciju")
    void fulfillingRemovesStock() {
        ProductStockView before = stocked();
        UserView customer = fixtures.customer();

        ReservationView reservation = reservations.create(customer.id(),
                new ReservationRequest(before.id(), 2, null, null));
        ReservationView fulfilled = reservations.fulfill(reservation.id(), customer.id());

        ProductStockView after = inventory.getForStaff(before.id());
        assertThat(fulfilled.status()).isEqualTo(ReservationStatus.FULFILLED);
        assertThat(after.physicalQuantity()).isEqualTo(before.physicalQuantity() - 2);
        assertThat(after.reservedQuantity()).isEqualTo(before.reservedQuantity());
    }

    @Test
    @DisplayName("Izdana rezervacija se više ne može otkazati")
    void fulfilledReservationCannotBeCancelled() {
        ProductStockView product = stocked();
        UserView customer = fixtures.customer();

        ReservationView reservation = reservations.create(customer.id(),
                new ReservationRequest(product.id(), 1, null, null));
        reservations.fulfill(reservation.id(), customer.id());

        assertThatThrownBy(() -> reservations.cancelAsCustomer(reservation.id(), customer.id()))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    @DisplayName("Rezervacija veća od raspoložive količine se odbija")
    void cannotReserveMoreThanAvailable() {
        ProductStockView product = stocked();
        UserView customer = fixtures.customer();

        assertThatThrownBy(() -> reservations.create(customer.id(),
                new ReservationRequest(product.id(), product.availableQuantity() + 1, null, null)))
                .isInstanceOf(InsufficientStockException.class);

        // Neuspjeh ne smije ostaviti trag: stanje je nepromijenjeno.
        assertThat(inventory.getForStaff(product.id()).reservedQuantity())
                .isEqualTo(product.reservedQuantity());
    }

    @Test
    @DisplayName("Rezervacija se ne može vezati na tuđi termin")
    void cannotAttachToForeignAppointment() {
        ProductStockView product = stocked();
        UserView customer = fixtures.customer();

        assertThatThrownBy(() -> reservations.create(customer.id(),
                new ReservationRequest(product.id(), 1, 999_999L, null)))
                .isInstanceOf(NotFoundException.class);
    }

    private ProductStockView stocked() {
        ProductStockView product = inventory
                .searchForStaff("TEST-PLENTY", null, true, PageRequest.of(0, 1)).getContent().getFirst();
        if (product.availableQuantity() < 20) {
            inventory.receive(product.id(), 100, "Dopuna za test", null);
            return inventory.getForStaff(product.id());
        }
        return product;
    }
}
