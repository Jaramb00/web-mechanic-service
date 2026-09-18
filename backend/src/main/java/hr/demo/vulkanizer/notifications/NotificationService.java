package hr.demo.vulkanizer.notifications;

import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Obavijesti unutar aplikacije.
 *
 * DEMO: sve ostaje u bazi i prikazuje se u portalu. Slanje e-maila i SMS-a je
 * svjesno izostavljeno — vidi docs/OPEN-QUESTIONS.md.
 */
@Service
public class NotificationService {

    private final NotificationRepository notifications;

    NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    @Transactional
    public void notifyUser(Long userId, String type, String title, String body) {
        notifications.save(new Notification(userId, type, title, truncate(body)));
    }

    @Transactional(readOnly = true)
    public Page<NotificationView> listForUser(Long userId, Pageable pageable) {
        return notifications.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(n -> new NotificationView(n.getId(), n.getType(), n.getTitle(),
                        n.getBody(), n.getReadAt(), n.getCreatedAt()));
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notifications.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        Notification notification = notifications.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new NotFoundException("Obavijest nije pronađena."));
        notification.markRead();
    }

    @Transactional
    public void markAllRead(Long userId) {
        notifications.markAllRead(userId);
    }

    private static String truncate(String body) {
        return body != null && body.length() > 1000 ? body.substring(0, 1000) : body;
    }
}
