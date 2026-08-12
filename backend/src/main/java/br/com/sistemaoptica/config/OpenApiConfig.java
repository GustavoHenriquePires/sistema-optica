package br.com.sistemaoptica.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI sistemaOpticaOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Sistema Óptica API")
                .description("API para gestão de ópticas e laboratórios ópticos")
                .version("v1")
                .contact(new Contact().name("Gustavo Henrique"))
        );
    }
}
