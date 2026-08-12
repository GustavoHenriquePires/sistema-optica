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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ProdutoControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void deveCadastrarListarEBuscarProduto() throws Exception {
        String produto = """
                {
                  "nome": "Armação Urban 402",
                  "categoria": "ARMACAO",
                  "marca": "Urban",
                  "descricao": "Armação leve em acetato",
                  "preco": 349.90,
                  "quantidadeEstoque": 8,
                  "ativo": true
                }
                """;

        String location = mockMvc.perform(post("/produtos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(produto))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.nome").value("Armação Urban 402"))
                .andExpect(jsonPath("$.categoria").value("ARMACAO"))
                .andExpect(jsonPath("$.preco").value(349.90))
                .andReturn().getResponse().getHeader("Location");

        mockMvc.perform(get(location))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidadeEstoque").value(8));

        mockMvc.perform(get("/produtos").param("categoria", "ARMACAO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].marca").value("Urban"));
    }

    @Test
    void deveAtualizarEstoque() throws Exception {
        String location = mockMvc.perform(post("/produtos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Lente Blue Cut","categoria":"LENTE","preco":180.00,"quantidadeEstoque":3,"ativo":true}
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        mockMvc.perform(patch(location + "/estoque")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantidadeEstoque\": 15}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidadeEstoque").value(15));
    }

    @Test
    void deveValidarDadosDoProduto() throws Exception {
        mockMvc.perform(post("/produtos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"","categoria":null,"preco":0,"quantidadeEstoque":-1,"ativo":true}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.nome").exists())
                .andExpect(jsonPath("$.fieldErrors.categoria").exists())
                .andExpect(jsonPath("$.fieldErrors.preco").exists())
                .andExpect(jsonPath("$.fieldErrors.quantidadeEstoque").exists());
    }
}
