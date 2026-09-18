package hr.demo.vulkanizer.inventory;

/** Vrste promjena zalihe. Svaka promjena količine ima točno jedan ovakav zapis. */
public enum MovementType {
    /** Početno stanje pri uvođenju sustava. */
    INITIAL_STOCK,
    /** Zaprimanje robe od dobavljača. */
    PURCHASE,
    /** Rezervacija kupca — diže rezervirano, ne dira fizičko stanje. */
    RESERVATION,
    /** Oslobađanje rezervacije (otkazano ili isteklo). */
    RELEASE,
    /** Utrošak na servisnom terminu — skida i fizičko i rezervirano. */
    SERVICE_USAGE,
    /** Ručna korekcija (inventura, oštećenje, greška u unosu). */
    ADJUSTMENT
}
