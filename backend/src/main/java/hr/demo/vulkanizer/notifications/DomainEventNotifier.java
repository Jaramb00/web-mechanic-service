package hr.demo.vulkanizer.notifications;

import hr.demo.vulkanizer.appointments.AppointmentBookedEvent;
import hr.demo.vulkanizer.appointments.AppointmentStatusChangedEvent;
import hr.demo.vulkanizer.catalog.ServiceCatalogFacade;
import hr.demo.vulkanizer.config.AppProperties;
import hr.demo.vulkanizer.inventory.LowStockEvent;
import hr.demo.vulkanizer.reservations.ReservationCreatedEvent;
import hr.demo.vulkanizer.users.RoleName;
import hr.demo.vulkanizer.users.UserFacade;
import hr.demo.vulkanizer.users.UserView;
import hr.demo.vulkanizer.vehicles.VehicleFacade;
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
    private final ServiceCatalogFacade services;
    private final VehicleFacade vehicles;
    private final MailSender mail;
    private final AppProperties.Mail mailSettings;
    private final ZoneId zone;

    DomainEventNotifier(NotificationService notifications, UserFacade users,
                        ServiceCatalogFacade services, VehicleFacade vehicles,
                        MailSender mail, AppProperties properties) {
        this.notifications = notifications;
        this.users = users;
        this.services = services;
        this.vehicles = vehicles;
        this.mail = mail;
        this.mailSettings = properties.mail();
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

    /**
     * Dojava servisu da je stigla nova rezervacija.
     *
     * Namjerno je ZASEBAN slušatelj, i namjerno bez {@code @Transactional}:
     * sastavljanje poruke ide u nekoliko modula, pa bi u zajedničkoj transakciji
     * jedan neuspjeli dohvat označio transakciju za rollback i progutao obavijest
     * u aplikaciji koja je već spremljena. Ovako dvoje ne mogu srušiti jedno drugo.
     *
     * Kupcu se potvrda NE šalje: nemamo provjeru je li adresa koju je upisao
     * stvarno njegova, a slanje na neprovjerenu adresu je put u spam liste.
     * Preduvjeti su u docs/OPEN-QUESTIONS.md.
     */
    @TransactionalEventListener
    public void onAppointmentBookedSendMail(AppointmentBookedEvent event) {
        String recipient = mailSettings.shopRecipient();
        if (recipient == null || recipient.isBlank()) {
            log.debug("Dojava servisu preskočena: app.mail.shop-recipient nije postavljen.");
            return;
        }
        try {
            mail.send(BookingMail.forShop(recipient, mailSettings.portalUrl(), zone, event,
                    users.findById(event.customerId()).orElse(null),
                    services.getById(event.serviceId()),
                    vehicles.getAny(event.vehicleId())));
        } catch (RuntimeException e) {
            // Termin je već commitan. Neuspjela dojava je problem servisa, ne kupca.
            log.error("Dojava o rezervaciji {} nije poslana: {}", event.appointmentId(), e.getMessage(), e);
        }
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
