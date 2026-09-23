package hr.demo.vulkanizer.notifications;

import hr.demo.vulkanizer.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Stvarno slanje SMTP-om.
 *
 * Dvije odluke koje su ovdje bitnije od samog slanja:
 *
 * 1. Konstruktor PADA ako konfiguracija nije potpuna. Aplikacija koja se digne
 *    s `app.mail.enabled=true` i praznom lozinkom mjesecima tiho ne šalje, a
 *    nitko to ne primijeti dok klijentu ne promakne termin.
 * 2. {@link #send} guta {@link MailException} i samo je zapisuje. Termin je u
 *    tom trenutku već commitan; ako SMTP ne odgovori, kupac ne smije dobiti
 *    grešku na rezervaciju koja je uspjela.
 */
@Component
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true")
class SmtpMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpMailSender.class);

    private final JavaMailSender mailSender;
    private final String from;

    SmtpMailSender(JavaMailSender mailSender, AppProperties properties,
                   @Value("${spring.mail.username:}") String username,
                   @Value("${spring.mail.password:}") String password) {
        AppProperties.Mail mail = properties.mail();
        require(username, "spring.mail.username (MAIL_USERNAME)");
        require(password, "spring.mail.password (MAIL_PASSWORD)");
        require(mail.from(), "app.mail.from (MAIL_FROM)");
        require(mail.shopRecipient(), "app.mail.shop-recipient (MAIL_SHOP_RECIPIENT)");
        this.mailSender = mailSender;
        this.from = mail.from();
    }

    private static void require(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "app.mail.enabled=true, a " + name + " nije postavljen. "
                            + "Postavi varijablu okoline ili isključi slanje s MAIL_ENABLED=false.");
        }
    }

    @Override
    public void send(MailMessage message) {
        SimpleMailMessage email = new SimpleMailMessage();
        email.setFrom(from);
        email.setTo(message.to());
        email.setSubject(message.subject());
        email.setText(message.body());
        try {
            mailSender.send(email);
            log.info("E-mail poslan na {}: {}", message.to(), message.subject());
        } catch (MailException e) {
            log.error("Slanje e-maila na {} nije uspjelo: {}", message.to(), e.getMessage(), e);
        }
    }
}
