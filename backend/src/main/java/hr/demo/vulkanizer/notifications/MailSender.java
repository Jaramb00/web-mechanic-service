package hr.demo.vulkanizer.notifications;

/**
 * Izlaz prema e-mailu. Dvije implementacije, bira ih `app.mail.enabled`:
 * {@link LoggingMailSender} (demo i testovi) i {@link SmtpMailSender}.
 *
 * Ugovor: metoda NE BACA iznimku. Poruka se šalje nakon što je termin već
 * commitan, pa pad slanja ne smije postati greška kupcu koji je uspio rezervirati.
 */
interface MailSender {

    void send(MailMessage message);
}
