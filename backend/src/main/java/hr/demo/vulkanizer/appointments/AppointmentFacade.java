package hr.demo.vulkanizer.appointments;

import java.time.LocalDate;

/**
 * Javni ulaz u `appointments` za druge module.
 *
 * Namjerno uzak: drugi moduli trebaju znati postoji li termin i smiju li ga
 * vezati uz svoj zapis — ne trebaju cijeli entitet.
 */
public interface AppointmentFacade {

    /** Postoji li termin i pripada li zadanom kupcu (za vezanje rezervacije artikla). */
    boolean isOwnedAndActive(Long appointmentId, Long customerId);

    long countForDay(LocalDate date);

    long countByStatus(AppointmentStatus status);

    long countCompletedForDay(LocalDate date);
}
