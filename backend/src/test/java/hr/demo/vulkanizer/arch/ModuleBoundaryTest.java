package hr.demo.vulkanizer.arch;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * Granice modula, provjerene automatski.
 *
 * Namjerno je odabran ArchUnit umjesto Spring Modulitha: za devet paketa i
 * demo opseg ovih dvadesetak redaka daje isto jamstvo bez dodatnog okvira i
 * bez nametnute strukture paketa.
 */
class ModuleBoundaryTest {

    private static JavaClasses classes;

    @BeforeAll
    static void importClasses() {
        classes = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("hr.demo.vulkanizer");
    }

    @Test
    @DisplayName("Entiteti ne smiju izlaziti iz svog modula")
    void entitiesStayInsideTheirModule() {
        classes().that().areAnnotatedWith(jakarta.persistence.Entity.class)
                .should().notBePublic()
                .as("JPA entiteti moraju biti package-private — drugi moduli dobivaju view recorde, ne entitete")
                .check(classes);
    }

    @Test
    @DisplayName("Repozitoriji ostaju interni za svoj modul")
    void repositoriesStayInternal() {
        classes().that().haveSimpleNameEndingWith("Repository")
                .should().notBePublic()
                .as("repozitorij je interna stvar modula; van ide samo facade")
                .check(classes);
    }

    @Test
    @DisplayName("Inventory ne smije ovisiti o terminima ni rezervacijama")
    void inventoryHasNoUpstreamDependencies() {
        noClasses().that().resideInAPackage("..inventory..")
                .should().dependOnClassesThat()
                .resideInAnyPackage("..appointments..", "..reservations..", "..admin..", "..notifications..")
                .as("inventory prima StockRef, pa ne treba znati tko ga zove — inače nastaje kružna ovisnost")
                .check(classes);
    }

    @Test
    @DisplayName("Nitko ne ovisi o admin modulu")
    void nothingDependsOnAdmin() {
        noClasses().that().resideOutsideOfPackage("..admin..")
                .should().dependOnClassesThat().resideInAPackage("..admin..")
                .as("admin je najviši sloj: ovisi o svima, o njemu nitko")
                .check(classes);
    }

    @Test
    @DisplayName("Domenski moduli ne ovise o obavijestima")
    void domainDoesNotDependOnNotifications() {
        noClasses().that().resideInAnyPackage("..appointments..", "..reservations..", "..inventory..",
                        "..vehicles..", "..catalog..", "..users..")
                .should().dependOnClassesThat().resideInAPackage("..notifications..")
                .as("obavijesti se vežu na događaje, pa ih domena ne mora poznavati")
                .check(classes);
    }

    @Test
    @DisplayName("Entiteti se ne smiju vezati izravno na HTTP sloj")
    void entitiesAreNotExposedOverHttp() {
        noClasses().that().areAnnotatedWith(jakarta.persistence.Entity.class)
                .should().dependOnClassesThat()
                .resideInAnyPackage("org.springframework.web..", "io.swagger..")
                .as("entitet se nikad ne veže na request/response — uvijek ide DTO")
                .check(classes);
    }
}
