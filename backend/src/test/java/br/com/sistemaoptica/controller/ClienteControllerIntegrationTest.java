package br.com.sistemaoptica.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ClienteControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void deveCadastrarClientePelaApi() throws Exception {
        String body = """
                {
                  "nome": "Ana Souza",
                  "cpf": "529.982.247-25",
                  "telefone": "(67) 99999-9999",
                  "email": "ANA@EXAMPLE.COM"
                }
                """;

        mockMvc.perform(post("/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.matchesPattern("/clientes/\\d+")))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nome").value("Ana Souza"))
                .andExpect(jsonPath("$.cpf").value("52998224725"))
                .andExpect(jsonPath("$.telefone").value("67999999999"))
                .andExpect(jsonPath("$.email").value("ana@example.com"));
    }

    @Test
    void deveRetornarErrosDeValidacaoPorCampo() throws Exception {
        String body = """
                {
                  "nome": "A",
                  "cpf": "123",
                  "telefone": "999",
                  "email": "email-invalido"
                }
                """;

        mockMvc.perform(post("/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Existem campos inválidos na requisição"))
                .andExpect(jsonPath("$.fieldErrors.nome").exists())
                .andExpect(jsonPath("$.fieldErrors.cpf").exists())
                .andExpect(jsonPath("$.fieldErrors.telefone").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists());
    }

    @Test
    void deveDisponibilizarDocumentacaoOpenApi() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Sistema Óptica API"))
                .andExpect(jsonPath("$.paths['/clientes']").exists())
                .andExpect(jsonPath("$.paths['/produtos']").exists())
                .andExpect(jsonPath("$.paths['/pedidos']").exists())
                .andExpect(jsonPath("$.paths['/dashboard']").exists());
    }
}
