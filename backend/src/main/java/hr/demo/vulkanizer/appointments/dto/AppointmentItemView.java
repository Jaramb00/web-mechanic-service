package hr.demo.vulkanizer.appointments.dto;

import java.math.BigDecimal;

public record AppointmentItemView(Long id, Long productId, Long serviceId, String description,
                                  int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {
}
