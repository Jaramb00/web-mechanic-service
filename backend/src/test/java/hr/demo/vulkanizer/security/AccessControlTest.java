package hr.demo.vulkanizer.security;

import hr.demo.vulkanizer.appointments.AppointmentBookingService;
import hr.demo.vulkanizer.appointments.dto.AppointmentCreateRequest;
import hr.demo.vulkanizer.appointments.dto.AppointmentView;
import hr.demo.vulkanizer.reservations.ReservationRequest;
import hr.demo.vulkanizer.reservations.ReservationService;
import hr.demo.vulkanizer.reservations.ReservationView;
import hr.demo.vulkanizer.inventory.InventoryFacade;
import hr.demo.vulkanizer.inventory.ProductStockView;
import hr.demo.vulkanizer.support.AbstractIntegrationTest;
import hr.demo.vulkanizer.users.RoleName;
import hr.demo.vulkanizer.users.UserView;
import hr.demo.vulkanizer.vehicles.VehicleView;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;

import java.time.LocalTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kontrola pristupa na razini pojedinačnog zapisa i uloge.
 *
 * Ovo je najvažniji sigurnosni test u projektu: provjerava da korisnik ne može
 * doći do tuđih podataka mijenjanjem ID-a u URL-u (IDOR).
 */
class AccessControlTest extends AbstractIntegrationTest {

    @Autowired
    private AppointmentBookingService booking;

    @Autowired
    private ReservationService reservations;

    @Autowired
    private InventoryFacade inventory;

    @Test
    @DisplayName("Kupac ne može dohvatiti tuđe vozilo — dobiva 404, ne 403")
    void cannotReadOthersVehicle() throws Exception {
        UserView owner = fixtures.customer();
        UserView intruder = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(owner);

        Cookie session = loginAs(intruder.email());

        // 404, a ne 403: 403 bi potvrdio da zapis s tim ID-em postoji.
        mockMvc.perform(get("/api/me/vehicles/{id}", vehicle.id()).cookie(session))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Kupac ne može izmijeniti ni obrisati tuđe vozilo")
    void cannotModifyOthersVehicle() throws Exception {
        UserView owner = fixtures.customer();
        UserView intruder = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(owner);
        Cookie session = loginAs(intruder.email());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/me/vehicles/{id}", vehicle.id()).cookie(session).with(csrf())
                        .contentType("application/json")
                        .content("""
                                {"make":"Otet","model":"Auto","modelYear":2020,
                                 "registration":"ZG9999XX","tireSize":null,"vin":null}
                                """))
                .andExpect(status().isNotFound());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/me/vehicles/{id}", vehicle.id()).cookie(session).with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Kupac ne može dohvatiti ni otkazati tuđi termin")
    void cannotReachOthersAppointment() throws Exception {
        UserView owner = fixtures.customer();
        VehicleView vehicle = fixtures.vehicleFor(owner);
        AppointmentView appointment = booking.book(owner.id(), new AppointmentCreateRequest(
                fixtures.service("Test usluga 30").id(), vehicle.id(),
                fixtures.futureSlot(20, LocalTime.of(9, 0)), null, null));

        UserView intruder = fixtures.customer();
        Cookie session = loginAs(intruder.email());

        mockMvc.perform(get("/api/me/appointments/{id}", appointment.id()).cookie(session))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/me/appointments/{id}/cancel", appointment.id()).cookie(session).with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Kupac ne može dohvatiti ni otkazati tuđu rezervaciju artikla")
    void cannotReachOthersReservation() throws Exception {
        UserView owner = fixtures.customer();
        ProductStockView product = stockedProduct();
        ReservationView reservation = reservations.create(owner.id(),
                new ReservationRequest(product.id(), 1, null, null));

        UserView intruder = fixtures.customer();
        Cookie session = loginAs(intruder.email());

        mockMvc.perform(get("/api/me/reservations/{id}", reservation.id()).cookie(session))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/me/reservations/{id}/cancel", reservation.id()).cookie(session).with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Kupac nema pristup admin, skladišnim ni radnim rutama")
    void customerCannotReachStaffRoutes() throws Exception {
        Cookie session = loginAs(fixtures.customer().email());

        mockMvc.perform(get("/api/admin/dashboard").cookie(session)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/users").cookie(session)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/warehouse/products").cookie(session)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/work/appointments/day").cookie(session)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/staff/reservations").cookie(session)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Majstor vidi radne naloge, ali ne i skladište ni administraciju")
    void employeeSeesOnlyOwnScope() throws Exception {
        UserView employee = fixtures.userWithRoles(Set.of(RoleName.EMPLOYEE));
        Cookie session = loginAs(employee.email());

        mockMvc.perform(get("/api/work/appointments/day").cookie(session)).andExpect(status().isOk());
        mockMvc.perform(get("/api/warehouse/products").cookie(session)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/dashboard").cookie(session)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Skladištar vidi skladište, ali ne radne naloge ni administraciju")
    void warehouseWorkerSeesOnlyOwnScope() throws Exception {
        UserView worker = fixtures.userWithRoles(Set.of(RoleName.WAREHOUSE_WORKER));
        Cookie session = loginAs(worker.email());

        mockMvc.perform(get("/api/warehouse/products").cookie(session)).andExpect(status().isOk());
        mockMvc.perform(get("/api/work/appointments/day").cookie(session)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/users").cookie(session)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Administrator ima pristup svim dijelovima sustava")
    void adminReachesEverything() throws Exception {
        UserView admin = fixtures.userWithRoles(Set.of(RoleName.ADMIN));
        Cookie session = loginAs(admin.email());

        mockMvc.perform(get("/api/admin/dashboard").cookie(session)).andExpect(status().isOk());
        mockMvc.perform(get("/api/warehouse/products").cookie(session)).andExpect(status().isOk());
        mockMvc.perform(get("/api/work/appointments/day").cookie(session)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Javni katalog artikala ne otkriva nabavnu cijenu ni stanje skladišta")
    void publicCatalogIsTrimmed() throws Exception {
        stockedProduct();

        String body = mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(body)
                .doesNotContain("purchasePrice")
                .doesNotContain("physicalQuantity")
                .doesNotContain("reservedQuantity");
        assertThat(body).contains("availableQuantity");
    }

    private ProductStockView stockedProduct() {
        ProductStockView product = inventory.searchForStaff("TEST-PLENTY", null, true, PageRequest.of(0, 1))
                .getContent().getFirst();
        if (product.availableQuantity() < 50) {
            inventory.receive(product.id(), 200, "Dopuna za test", null);
            return inventory.getForStaff(product.id());
        }
        return product;
    }
}
