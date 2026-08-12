package br.com.sistemaoptica.controller;

import br.com.sistemaoptica.entity.Cliente;
import br.com.sistemaoptica.entity.CategoriaProduto;
import br.com.sistemaoptica.entity.Produto;
import br.com.sistemaoptica.repository.ClienteRepository;
import br.com.sistemaoptica.repository.ProdutoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PedidoControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ClienteRepository clienteRepository;
    @Autowired private ProdutoRepository produtoRepository;

    private Cliente cliente;
    private Produto produto;

    @BeforeEach
    void setUp() {
        cliente = new Cliente();
        cliente.setNome("Ana Souza");
        cliente.setCpf("52998224725");
        cliente.setTelefone("67999999999");
        cliente = clienteRepository.save(cliente);

        produto = new Produto();
        produto.setNome("Lente Blue Cut");
        produto.setCategoria(CategoriaProduto.LENTE);
        produto.setPreco(new BigDecimal("180.00"));
        produto.setQuantidadeEstoque(10);
        produto.setAtivo(true);
        produto = produtoRepository.save(produto);
    }

    @Test
    void deveCriarPedidoCalcularTotalEBaixarEstoque() throws Exception {
        String body = """
                {
                  "clienteId": %d,
                  "itens": [{"produtoId": %d, "quantidade": 2}],
                  "dataPrevisao": "2099-12-31",
                  "observacoes": "Montagem prioritária"
                }
                """.formatted(cliente.getId(), produto.getId());

        mockMvc.perform(post("/pedidos").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cliente.id").value(cliente.getId()))
                .andExpect(jsonPath("$.status").value("RECEBIDO"))
                .andExpect(jsonPath("$.valorTotal").value(360.00))
                .andExpect(jsonPath("$.itens[0].subtotal").value(360.00));

        mockMvc.perform(get("/produtos/" + produto.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidadeEstoque").value(8));
    }

    @Test
    void deveAtualizarFluxoDeStatus() throws Exception {
        String location = mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"clienteId":%d,"itens":[{"produtoId":%d,"quantidade":1}]}
                                """.formatted(cliente.getId(), produto.getId())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        mockMvc.perform(patch(location + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"EM_PRODUCAO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EM_PRODUCAO"));

        mockMvc.perform(patch(location + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ENTREGUE\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void deveCancelarPedidoEDevolverEstoque() throws Exception {
        String location = mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"clienteId":%d,"itens":[{"produtoId":%d,"quantidade":3}]}
                                """.formatted(cliente.getId(), produto.getId())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        mockMvc.perform(patch(location + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CANCELADO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELADO"));

        mockMvc.perform(get("/produtos/" + produto.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidadeEstoque").value(10));
    }

    @Test
    void naoDeveCriarPedidoSemEstoqueOuSemItens() throws Exception {
        mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"clienteId\":" + cliente.getId() + ",\"itens\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.itens").exists());

        mockMvc.perform(post("/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"clienteId":%d,"itens":[{"produtoId":%d,"quantidade":99}]}
                                """.formatted(cliente.getId(), produto.getId())))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Estoque insuficiente")));
    }

    @Test
    void deveExporIndicadoresNoDashboard() throws Exception {
        mockMvc.perform(get("/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalClientes").isNumber())
                .andExpect(jsonPath("$.totalPedidos").isNumber())
                .andExpect(jsonPath("$.produtosCadastrados").isNumber())
                .andExpect(jsonPath("$.pedidosRecentes").isArray());
    }
}
