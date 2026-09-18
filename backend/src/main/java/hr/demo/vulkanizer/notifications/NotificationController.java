package hr.demo.vulkanizer.notifications;

import hr.demo.vulkanizer.auth.AppPrincipal;
import hr.demo.vulkanizer.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Obavijesti")
@RestController
@RequestMapping("/api/me/notifications")
@Validated
class NotificationController {

    private final NotificationService notifications;

    NotificationController(NotificationService notifications) {
        this.notifications = notifications;
    }

    @Operation(summary = "Moje obavijesti")
    @GetMapping
    PageResponse<NotificationView> list(@AuthenticationPrincipal AppPrincipal me,
                                        @RequestParam(defaultValue = "0") @Min(0) int page,
                                        @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        var result = notifications.listForUser(me.userId(), PageRequest.of(page, size));
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Operation(summary = "Broj nepročitanih obavijesti")
    @GetMapping("/unread-count")
    UnreadCount unreadCount(@AuthenticationPrincipal AppPrincipal me) {
        return new UnreadCount(notifications.unreadCount(me.userId()));
    }

    @Operation(summary = "Označi obavijest pročitanom")
    @PostMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void markRead(@AuthenticationPrincipal AppPrincipal me, @PathVariable Long id) {
        notifications.markRead(id, me.userId());
    }

    @Operation(summary = "Označi sve pročitanima")
    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void markAllRead(@AuthenticationPrincipal AppPrincipal me) {
        notifications.markAllRead(me.userId());
    }

    record UnreadCount(long count) {
    }
}
