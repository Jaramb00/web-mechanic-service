package hr.demo.vulkanizer.notifications;

import hr.demo.vulkanizer.appointments.AppointmentBookedEvent;
import hr.demo.vulkanizer.catalog.ServiceView;
import hr.demo.vulkanizer.users.UserView;
import hr.demo.vulkanizer.vehicles.VehicleView;

import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Sastavlja tekst dojave o novoj rezervaciji.
 *
 * Čista funkcija, bez I/O — zato se sadržaj poruke može testirati bez
 * pokretanja ičega. Obični tekst, ne HTML: poruka ima osam redaka i HTML joj ne
 * bi donio ništa osim načina da završi u spamu.
 */
final class BookingMail {

    private static final Locale HR = Locale.of("hr", "HR");
    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("dd.MM.yyyy. 'u' HH:mm", HR);

    private BookingMail() {
    }

    static MailMessage forShop(String recipient, String portalUrl, ZoneId zone,
                               AppointmentBookedEvent event, UserView customer,
                               ServiceView service, VehicleView vehicle) {
        String when = event.startAt().atZone(zone).format(WHEN);
        String body = """
                Termin:  %s
                Usluga:  %s (%d min, %s)
                Kupac:   %s
                Telefon: %s
                E-mail:  %s
                Vozilo:  %s
                Napomena kupca: %s

                Status: NA ČEKANJU. Potvrdite termin u portalu:
                %s/portal/termini
                """.formatted(
                when,
                text(service == null ? null : service.name()),
                service == null ? 0 : service.durationMinutes(),
                service == null ? "—" : NumberFormat.getCurrencyInstance(HR).format(service.price()),
                text(customer == null ? null : customer.fullName()),
                text(customer == null ? null : customer.phone()),
                text(customer == null ? null : customer.email()),
                text(vehicle == null ? null : vehicle.label()),
                text(event.customerNote()),
                portalUrl);

        return new MailMessage(recipient, "Nova rezervacija — " + when, body);
    }

    /**
     * Prazno polje ostaje vidljivo kao crtica. Redak koji nestane čita se kao da
     * podatka nema u sustavu, a ne kao da ga kupac nije upisao.
     */
    private static String text(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }
}
