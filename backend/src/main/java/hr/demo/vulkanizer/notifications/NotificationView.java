package hr.demo.vulkanizer.notifications;

import java.time.Instant;

public record NotificationView(Long id, String type, String title, String body,
                               Instant readAt, Instant createdAt) {

    public boolean read() {
        return readAt != null;
    }
}
