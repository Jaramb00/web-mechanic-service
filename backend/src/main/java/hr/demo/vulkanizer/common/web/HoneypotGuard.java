package hr.demo.vulkanizer.common.web;

import hr.demo.vulkanizer.common.error.DomainExceptions.BusinessRuleException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.StringUtils;

/**
 * Jednostavna zaštita od botova na javnim formama.
 *
 * U formu se doda polje skriveno CSS-om; čovjek ga ne vidi, a jednostavni bot
 * popuni sva polja. Odgovor namjerno ne imenuje polje.
 *
 * DEMO: ovo zaustavlja samo nevješte botove. Za produkciju se predviđa
 * CAPTCHA (npr. hCaptcha/Turnstile) — vidi docs/SECURITY.md.
 */
public final class HoneypotGuard {

    private static final Logger log = LoggerFactory.getLogger(HoneypotGuard.class);

    private HoneypotGuard() {
    }

    public static void check(String honeypotValue) {
        if (StringUtils.hasText(honeypotValue)) {
            log.warn("Zahtjev odbijen: popunjeno honeypot polje.");
            throw new BusinessRuleException("Zahtjev je odbijen.");
        }
    }
}
