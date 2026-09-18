package hr.demo.vulkanizer.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class OpenApiConfig {

    @Bean
    OpenAPI vulkanizerOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Vulkanizerski servis — demo API")
                .version("0.1.0")
                .description("""
                        Demo REST API za vulkanizerski servis.

                        Autentikacija ide preko HttpOnly cookieja, pa u Swagger UI-u nema
                        polja za token: prvo pozovite `POST /api/auth/login` odavde, cookie
                        se postavi u pregledniku i ostali pozivi rade.

                        Zahtjevi koji mijenjaju podatke traže CSRF zaglavlje `X-XSRF-TOKEN`;
                        vrijednost se dobiva na `GET /api/auth/csrf`.
                        """)
                .license(new License().name("Demo — nije za produkciju")));
    }
}
