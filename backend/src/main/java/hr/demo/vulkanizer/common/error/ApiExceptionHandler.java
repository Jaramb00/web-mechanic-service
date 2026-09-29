package hr.demo.vulkanizer.common.error;

import hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException;
import hr.demo.vulkanizer.common.error.DomainExceptions.ConflictException;
import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import hr.demo.vulkanizer.common.error.DomainExceptions.TooManyRequestsException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Centralizirano rukovanje greškama. Odgovori su RFC 7807 ProblemDetail s
 * porukama na hrvatskom jer ih frontend prikazuje korisniku izravno.
 *
 * Pravilo: klijent nikad ne dobiva stack trace, SQL, ni interne nazive tablica.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail onNotFound(NotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Nije pronađeno", ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ProblemDetail onConflict(ConflictException ex) {
        return problem(HttpStatus.CONFLICT, "Sukob sa stanjem sustava", ex.getMessage());
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ProblemDetail onBusinessRule(BusinessRuleException ex) {
        return problem(HttpStatus.UNPROCESSABLE_ENTITY, "Zahtjev nije prihvatljiv", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail onValidation(MethodArgumentNotValidException ex) {
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, "Neispravni podaci",
                "Provjerite označena polja i pokušajte ponovno.");
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> fields.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        pd.setProperty("fields", fields);
        return pd;
    }

    /**
     * Pada i kad payload sadrži polje koje DTO ne poznaje
     * (fail-on-unknown-properties) — npr. pokušaj podmetanja "role" ili "price".
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail onUnreadable(HttpMessageNotReadableException ex) {
        log.debug("Neispravan request body: {}", ex.getMessage());
        return problem(HttpStatus.BAD_REQUEST, "Neispravan zahtjev",
                "Tijelo zahtjeva nije u očekivanom obliku.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail onAccessDenied(AccessDeniedException ex) {
        return problem(HttpStatus.FORBIDDEN, "Pristup odbijen",
                "Nemate ovlasti za ovu radnju.");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail onAuthentication(AuthenticationException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "Niste prijavljeni",
                "Za ovu radnju potrebna je prijava.");
    }

    /**
     * Zadnja crta obrane za constrainte koje servis nije unaprijed uhvatio
     * (npr. jedinstvena registracija vozila). Detalj iz baze se NE prosljeđuje.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail onDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Narušen integritet podataka", ex);
        return problem(HttpStatus.CONFLICT, "Sukob sa stanjem sustava",
                "Podatak se kosi s postojećim zapisom.");
    }

    /**
     * Previše zahtjeva je 429, ne 422. Klijent mora moći razlikovati „uspori"
     * od „podaci ne valjaju" — inače sučelje na oboje kaže istu poruku.
     */
    @ExceptionHandler(TooManyRequestsException.class)
    public ProblemDetail onTooManyRequests(TooManyRequestsException ex) {
        return problem(HttpStatus.TOO_MANY_REQUESTS, "Previše zahtjeva", ex.getMessage());
    }

    /*
     * ---------------------------------------------------------------------
     * Neispravan ZAHTJEV nije greška poslužitelja.
     *
     * Sve iznimke ispod Spring baca prije nego zahtjev uopće dođe do metode
     * kontrolera. Bez vlastitog handlera upadaju u catch-all na dnu, pa
     * korisnik dobije 500 i poruku „Dogodila se neočekivana greška" — istu
     * koju dobije kad aplikacija stvarno pukne — a log se napuni stack
     * traceovima koji skrivaju prave kvarove.
     *
     * To se već dogodilo: NoResourceFoundException je popravljen zasebno, a
     * sestrinski slučajevi su promakli i vraćali 500 sve dok ih prolaz kroz
     * API nije izvadio na vidjelo. Zato su ovdje svi na okupu, uz test koji
     * ih drži na okupu (ApiErrorMappingTest).
     * ---------------------------------------------------------------------
     */

    /** Nepostojeća ruta je 404, ne 500 — inače dijagnoza traži kvar u kodu umjesto u URL-u. */
    @ExceptionHandler(NoResourceFoundException.class)
    public ProblemDetail onNoResource(NoResourceFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Nije pronađeno", "Tražena putanja ne postoji.");
    }

    /** Ruta postoji, ali ne za ovu HTTP metodu. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ProblemDetail onMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return problem(HttpStatus.METHOD_NOT_ALLOWED, "Metoda nije dopuštena",
                "Tražena putanja ne podržava tu HTTP metodu.");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ProblemDetail onMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
        return problem(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Nepodržan format",
                "Tijelo zahtjeva mora biti application/json.");
    }

    /** Npr. /api/me/vehicles/abc ili ?from=nijedatum — krivi tip u putanji ili parametru. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail onTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return problem(HttpStatus.BAD_REQUEST, "Neispravan zahtjev",
                "Vrijednost parametra „" + ex.getName() + "\" nije ispravnog oblika.");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ProblemDetail onMissingParameter(MissingServletRequestParameterException ex) {
        return problem(HttpStatus.BAD_REQUEST, "Neispravan zahtjev",
                "Nedostaje obavezan parametar „" + ex.getParameterName() + "\".");
    }

    /**
     * Provjere s @Validated na kontroleru (npr. @Min(0) int page, @Max(100) int size).
     * Bez ovoga negativna stranica ruši zahtjev umjesto da ga uredno odbije.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail onConstraintViolation(ConstraintViolationException ex) {
        return problem(HttpStatus.BAD_REQUEST, "Neispravni podaci",
                "Provjerite vrijednosti parametara i pokušajte ponovno.");
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail onUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Neočekivana greška na {} {}", request.getMethod(), request.getRequestURI(), ex);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Greška poslužitelja",
                "Dogodila se neočekivana greška. Pokušajte ponovno.");
    }

    private ProblemDetail problem(HttpStatus status, String title, String detail) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(title);
        return pd;
    }
}
