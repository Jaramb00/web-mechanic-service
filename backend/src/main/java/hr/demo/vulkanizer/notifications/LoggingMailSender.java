package hr.demo.vulkanizer.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Pošiljatelj za demo i testove: poruku ispiše u log umjesto da je pošalje.
 *
 * Ovo je namjerno default. Demo se time ne oslanja ni na jedan vanjski
 * poslužitelj, a u logu se vidi točno ono što bi otišlo na e-mail — pa se
 * sadržaj poruke može provjeriti bez ijednog poslanog maila.
 */
@Component
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "false", matchIfMissing = true)
class LoggingMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingMailSender.class);

    @Override
    public void send(MailMessage message) {
        log.info("[MAIL] Slanje je isključeno (app.mail.enabled=false). Poruka koja bi otišla:\n"
                + "  za: {}\n  naslov: {}\n{}", message.to(), message.subject(), message.body());
    }
}
