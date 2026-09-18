package hr.demo.vulkanizer.support;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Svaki pokretanje testova kreće od prazne baze.
 *
 * Bez ovoga bi testovi prolazili prvi put, a padali pri drugom pokretanju —
 * podaci iz prethodnog pokretanja bi popunili termine i potrošili zalihu.
 * Takav test je gori od nikakvog, jer laže o stanju sustava.
 */
@Profile("test")
@Configuration
public class TestFlywayConfig {

    @Bean
    FlywayMigrationStrategy cleanMigrateStrategy() {
        return flyway -> {
            flyway.clean();
            flyway.migrate();
        };
    }
}
