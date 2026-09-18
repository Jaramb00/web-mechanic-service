package hr.demo.vulkanizer.common.error;

/**
 * Domenske iznimke. Namjerno su malobrojne i preslikavaju se 1:1 na HTTP status
 * u {@link ApiExceptionHandler}, tako da nijedan servis ne mora znati za HTTP.
 */
public final class DomainExceptions {

    private DomainExceptions() {
    }

    /**
     * Resurs ne postoji — ILI postoji, ali ne pripada pozivatelju.
     * Namjerno se ne razlikuje: 403 na tuđem zapisu otkriva da zapis postoji.
     */
    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) {
            super(message);
        }
    }

    /** Zahtjev je ispravan, ali se kosi s trenutnim stanjem sustava. */
    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) {
            super(message);
        }
    }

    /** Zahtjev krši poslovno pravilo (npr. termin izvan radnog vremena). */
    public static class BusinessRuleException extends RuntimeException {
        public BusinessRuleException(String message) {
            super(message);
        }
    }

    /** Traženi termin je u međuvremenu zauzet. */
    public static class SlotUnavailableException extends ConflictException {
        public SlotUnavailableException(String message) {
            super(message);
        }
    }

    /** Nema dovoljno raspoložive količine artikla. */
    public static class InsufficientStockException extends ConflictException {
        public InsufficientStockException(String message) {
            super(message);
        }
    }
}
