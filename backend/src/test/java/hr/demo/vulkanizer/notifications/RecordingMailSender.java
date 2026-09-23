package hr.demo.vulkanizer.notifications;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Pošiljatelj koji poruke skuplja umjesto da ih šalje.
 *
 * Živi u paketu `notifications` jer su {@link MailSender} i {@link MailMessage}
 * package-private — granica modula vrijedi i za testove.
 */
class RecordingMailSender implements MailSender {

    private final List<MailMessage> sent = new CopyOnWriteArrayList<>();
    private volatile boolean failing = false;

    @Override
    public void send(MailMessage message) {
        if (failing) {
            throw new IllegalStateException("Simulirani pad pošiljatelja.");
        }
        sent.add(message);
    }

    List<MailMessage> sent() {
        return List.copyOf(sent);
    }

    void reset() {
        sent.clear();
        failing = false;
    }

    void failOnNextSend() {
        failing = true;
    }
}
