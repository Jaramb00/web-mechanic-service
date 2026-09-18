package hr.demo.vulkanizer.notifications;

import hr.demo.vulkanizer.appointments.AppointmentBookedEvent;
import hr.demo.vulkanizer.appointments.AppointmentStatusChangedEvent;
import hr.demo.vulkanizer.inventory.LowStockEvent;
import hr.demo.vulkanizer.reservations.ReservationCreatedEvent;
import hr.demo.vulkanizer.users.RoleName;
import hr.demo.vulkanizer.users.UserFacade;
import hr.demo.vulkanizer.users.UserView;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Pretvara domenske događaje u obavijesti.
 *
 * Sluša tek NAKON commita: obavijest o rezerviranom terminu ne smije nastati
 * ako se transakcija na kraju poništi. Ovo je jedino mjesto na kojem
 * `notifications` dodiruje ostale module — obrnuto nitko ne ovisi o njemu.
 */
@Component
class DomainEventNotifier {

    private static final Logger log = LoggerFactory.getLogger(DomainEventNotifier.class);
    private static final DateTimeFormatter WHEN =
            DateTimeFormatter.ofPattern("dd.MM.yyyy. 'u' HH:mm", Locale.of("hr"));

    private final NotificationService notifications;
    private final UserFacade users;
    private final ZoneId zone;

    DomainEventNotifier(NotificationService notifications, UserFacade users,
                        hr.demo.vulkanizer.config.AppProperties properties) {
        this.notifications = notifications;
        this.users = users;
        this.zone = properties.booking().zone();
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAppointmentBooked(AppointmentBookedEvent event) {
        notifications.notifyUser(event.customerId(), "APPOINTMENT_BOOKED",
                "Termin je zaprimljen",
                "Zaprimili smo vašu rezervaciju za " + event.startAt().atZone(zone).format(WHEN)
                        + ". Javit ćemo vam kad je potvrdimo.");
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAppointmentStatusChanged(AppointmentStatusChangedEvent event) {
        String title = switch (event.current()) {
            case CONFIRMED -> "Termin je potvrđen";
            case IN_PROGRESS -> "Servis je započeo";
            case COMPLETED -> "Servis je završen";
            case CANCELLED -> "Termin je otkazan";
            case NO_SHOW -> "Termin je evidentiran kao nedolazak";
            case PENDING -> "Termin je vraćen na čekanje";
        };
        notifications.notifyUser(event.customerId(), "APPOINTMENT_STATUS", title,
                "Status vašeg termina promijenjen je u: " + title.toLowerCase() + ".");
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onReservationCreated(ReservationCreatedEvent event) {
        notifications.notifyUser(event.customerId(), "RESERVATION_CREATED",
                "Rezervacija je zaprimljena",
                "Rezervirali ste " + event.quantity() + " kom artikla \"" + event.productName()
                        + "\". Javit ćemo vam kad bude spremno za preuzimanje.");
    }

    /**
     * Niska zaliha ide administratorima, ne kupcima.
     * DEMO: jedna obavijest po događaju, bez grupiranja i bez podsjetnika.
     */
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onLowStock(LowStockEvent event) {
        log.info("Niska zaliha: {} ({} kom, minimum {})", event.sku(), event.availableQuantity(), event.minQuantity());
        users.search(null, PageRequest.of(0, 50)).getContent().stream()
                .filter(u -> u.roles().contains(RoleName.ADMIN) && u.active())
                .map(UserView::id)
                .forEach(adminId -> notifications.notifyUser(adminId, "LOW_STOCK",
                        "Niska zaliha: " + event.name(),
                        "Artikl " + event.sku() + " ima još " + event.availableQuantity()
                                + " kom, minimum je " + event.minQuantity() + "."));
    }
}
