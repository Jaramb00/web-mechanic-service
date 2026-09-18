package hr.demo.vulkanizer.support;

import hr.demo.vulkanizer.catalog.ServiceCatalogFacade;
import hr.demo.vulkanizer.catalog.ServiceView;
import hr.demo.vulkanizer.users.RoleName;
import hr.demo.vulkanizer.users.UserFacade;
import hr.demo.vulkanizer.users.UserView;
import hr.demo.vulkanizer.vehicles.VehicleFacade;
import hr.demo.vulkanizer.vehicles.VehicleRequest;
import hr.demo.vulkanizer.vehicles.VehicleView;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Tvornica testnih podataka.
 *
 * Svaki test kreira vlastite korisnike i vozila s nasumičnim identifikatorima,
 * pa testovi ne ovise o redoslijedu izvođenja ni o stanju koje ostavi drugi
 * test. Baza se između testova ne čisti — nema potrebe.
 */
@Component
public class TestDataFactory {

    public static final String PASSWORD = "TestLozinka1";
    public static final ZoneId ZONE = ZoneId.of("Europe/Zagreb");

    private static final AtomicInteger PLATE_COUNTER = new AtomicInteger();

    private final UserFacade users;
    private final VehicleFacade vehicles;
    private final ServiceCatalogFacade catalog;

    public TestDataFactory(UserFacade users, VehicleFacade vehicles, ServiceCatalogFacade catalog) {
        this.users = users;
        this.vehicles = vehicles;
        this.catalog = catalog;
    }

    public UserView customer() {
        return users.registerCustomer(uniqueEmail("kupac"), PASSWORD, "Test Kupac", "+385 91 123 4567");
    }

    public UserView userWithRoles(Set<RoleName> roles) {
        return users.createUser(uniqueEmail("osoblje"), PASSWORD, "Test Osoblje", null, roles);
    }

    public VehicleView vehicleFor(UserView owner) {
        String plate = "ZG" + String.format("%04d", PLATE_COUNTER.incrementAndGet() % 10000)
                + UUID.randomUUID().toString().substring(0, 2).toUpperCase();
        return vehicles.create(owner.id(),
                new VehicleRequest("Volkswagen", "Golf", 2018, plate, "205/55 R16", null));
    }

    public ServiceView service(String name) {
        return catalog.listAll().stream()
                .filter(s -> s.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Testna usluga nije pronađena: " + name));
    }

    public String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@test.local";
    }

    /**
     * Slobodan radni termin daleko u budućnosti, da se ne sudari s podacima
     * drugih testova. Uvijek pada na radni dan i na mrežu slotova.
     */
    public Instant futureSlot(int daysAhead, LocalTime time) {
        LocalDate date = LocalDate.now(ZONE).plusDays(daysAhead);
        while (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            date = date.plusDays(1);
        }
        return LocalDateTime.of(date, time).atZone(ZONE).toInstant();
    }
}
