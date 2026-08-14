package br.com.sistemaoptica.service;

import br.com.sistemaoptica.dto.cliente.ClienteResponse;
import br.com.sistemaoptica.dto.common.PaginaResponse;
import br.com.sistemaoptica.dto.pedido.EtapaPedidoRequest;
import br.com.sistemaoptica.dto.pedido.HistoricoStatusResponse;
import br.com.sistemaoptica.dto.pedido.ItemPedidoRequest;
import br.com.sistemaoptica.dto.pedido.ItemPedidoResponse;
import br.com.sistemaoptica.dto.pedido.PedidoRequest;
import br.com.sistemaoptica.dto.pedido.PedidoResponse;
import br.com.sistemaoptica.dto.pedido.StatusPedidoRequest;
import br.com.sistemaoptica.entity.Cliente;
import br.com.sistemaoptica.entity.HistoricoStatusPedido;
import br.com.sistemaoptica.entity.ItemPedido;
import br.com.sistemaoptica.entity.Pedido;
import br.com.sistemaoptica.entity.PrioridadeOrdemServico;
import br.com.sistemaoptica.entity.Produto;
import br.com.sistemaoptica.entity.StatusPedido;
import br.com.sistemaoptica.exception.RecursoNaoEncontradoException;
import br.com.sistemaoptica.exception.RegraNegocioException;
import br.com.sistemaoptica.repository.HistoricoStatusPedidoRepository;
import br.com.sistemaoptica.repository.PedidoRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final HistoricoStatusPedidoRepository historicoRepository;
    private final ClienteService clienteService;
    private final ProdutoService produtoService;

    public PedidoService(PedidoRepository pedidoRepository,
                         HistoricoStatusPedidoRepository historicoRepository,
                         ClienteService clienteService,
                         ProdutoService produtoService) {
        this.pedidoRepository = pedidoRepository;
        this.historicoRepository = historicoRepository;
        this.clienteService = clienteService;
        this.produtoService = produtoService;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<PedidoResponse> listar(StatusPedido status, String cliente, Pageable pageable) {
        String clienteNormalizado = cliente == null || cliente.isBlank() ? null : cliente.strip();
        return PaginaResponse.from(pedidoRepository.buscar(status, clienteNormalizado, pageable).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public PedidoResponse buscarPorId(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional(readOnly = true)
    public List<HistoricoStatusResponse> listarHistorico(Long id) {
        buscarEntidade(id);
        return historicoRepository.findByPedidoIdOrderByDataHoraAsc(id).stream()
                .map(h -> new HistoricoStatusResponse(h.getId(), h.getStatusAnterior(), h.getStatusNovo(), h.getUsuario(), h.getObservacao(), h.getDataHora()))
                .toList();
    }

    @Transactional
    public PedidoResponse criar(PedidoRequest request) {
        Cliente cliente = clienteService.buscarEntidade(request.clienteId());
        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setDataPrevisao(request.dataPrevisao());
        pedido.setObservacoes(normalizarOpcional(request.observacoes()));
        pedido.setStatus(StatusPedido.RECEBIDO);
        pedido.setPrioridade(request.prioridade() == null ? PrioridadeOrdemServico.NORMAL : request.prioridade());
        pedido.setOdEsferico(request.odEsferico());
        pedido.setOdCilindrico(request.odCilindrico());
        pedido.setOdEixo(request.odEixo());
        pedido.setOdAdicao(request.odAdicao());
        pedido.setOdDnp(request.odDnp());
        pedido.setOdAltura(request.odAltura());
        pedido.setOeEsferico(request.oeEsferico());
        pedido.setOeCilindrico(request.oeCilindrico());
        pedido.setOeEixo(request.oeEixo());
        pedido.setOeAdicao(request.oeAdicao());
        pedido.setOeDnp(request.oeDnp());
        pedido.setOeAltura(request.oeAltura());
        pedido.setTipoLente(normalizarOpcional(request.tipoLente()));
        pedido.setMaterialLente(normalizarOpcional(request.materialLente()));
        pedido.setTratamento(normalizarOpcional(request.tratamento()));
        pedido.setArmacao(normalizarOpcional(request.armacao()));

        Map<Long, Integer> quantidades = agruparQuantidades(request);
        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> entrada : quantidades.entrySet()) {
            Produto produto = produtoService.buscarEntidade(entrada.getKey());
            validarProduto(produto, entrada.getValue());

            ItemPedido item = new ItemPedido();
            item.setProduto(produto);
            item.setQuantidade(entrada.getValue());
            item.setPrecoUnitario(produto.getPreco());
            item.setSubtotal(produto.getPreco().multiply(BigDecimal.valueOf(entrada.getValue())));
            pedido.adicionarItem(item);
            total = total.add(item.getSubtotal());

            produto.setQuantidadeEstoque(produto.getQuantidadeEstoque() - entrada.getValue());
        }
        pedido.setValorTotal(total);
        Pedido salvo = pedidoRepository.save(pedido);
        registrarHistorico(salvo, null, StatusPedido.RECEBIDO, "sistema", "OS registrada");
        return toResponse(salvo);
    }

    @Transactional
    public PedidoResponse atualizarStatus(Long id, StatusPedidoRequest request) {
        return avancarEtapa(id, new EtapaPedidoRequest(request.status(), "sistema", null));
    }

    @Transactional
    public PedidoResponse avancarEtapa(Long id, EtapaPedidoRequest request) {
        Pedido pedido = buscarEntidade(id);
        StatusPedido atual = pedido.getStatus();
        StatusPedido novo = request.status();
        if (atual == novo) return toResponse(pedido);

        validarTransicao(atual, novo);
        if (novo == StatusPedido.CANCELADO) devolverEstoque(pedido);

        pedido.setStatus(novo);
        Pedido salvo = pedidoRepository.save(pedido);
        registrarHistorico(salvo, atual, novo, normalizarOpcional(request.usuario()), normalizarOpcional(request.observacao()));
        return toResponse(salvo);
    }

    @Transactional
    public void excluir(Long id) {
        Pedido pedido = buscarEntidade(id);
        if (pedido.getStatus() != StatusPedido.CANCELADO) {
            throw new RegraNegocioException("Apenas pedidos cancelados podem ser excluídos");
        }
        pedidoRepository.delete(pedido);
    }

    public Pedido buscarEntidade(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado com o ID " + id));
    }

    private void registrarHistorico(Pedido pedido, StatusPedido anterior, StatusPedido novo, String usuario, String observacao) {
        HistoricoStatusPedido h = new HistoricoStatusPedido();
        h.setPedido(pedido);
        h.setStatusAnterior(anterior);
        h.setStatusNovo(novo);
        h.setUsuario(usuario == null ? "sistema" : usuario);
        h.setObservacao(observacao);
        historicoRepository.save(h);
    }

    private void devolverEstoque(Pedido pedido) {
        pedido.getItens().forEach(item -> item.getProduto().setQuantidadeEstoque(
                item.getProduto().getQuantidadeEstoque() + item.getQuantidade()
        ));
    }

    private Map<Long, Integer> agruparQuantidades(PedidoRequest request) {
        Map<Long, Integer> quantidades = new HashMap<>();
        if (request.itens() == null) return quantidades;
        for (ItemPedidoRequest item : request.itens()) {
            quantidades.merge(item.produtoId(), item.quantidade(), Integer::sum);
        }
        return quantidades;
    }

    private void validarProduto(Produto produto, int quantidade) {
        if (!produto.getAtivo()) throw new RegraNegocioException("O produto " + produto.getNome() + " está inativo");
        if (produto.getQuantidadeEstoque() < quantidade) {
            throw new RegraNegocioException("Estoque insuficiente para o produto " + produto.getNome());
        }
    }

    private void validarTransicao(StatusPedido atual, StatusPedido novo) {
        if (atual == novo) return;
        if (atual == StatusPedido.CANCELADO || atual == StatusPedido.ENTREGUE) {
            throw new RegraNegocioException("Pedidos finalizados não podem mudar de status");
        }
        if (novo == StatusPedido.CANCELADO || novo == StatusPedido.RETRABALHO) return;
        if (atual == StatusPedido.RETRABALHO) return;

        Map<StatusPedido, EnumSet<StatusPedido>> permitidos = Map.ofEntries(
                Map.entry(StatusPedido.RECEBIDO, EnumSet.of(StatusPedido.EM_PRODUCAO, StatusPedido.AGUARDANDO_APROVACAO, StatusPedido.DIGITADO, StatusPedido.SEPARACAO)),
                Map.entry(StatusPedido.EM_PRODUCAO, EnumSet.of(StatusPedido.SEPARACAO, StatusPedido.PRONTO)),
                Map.entry(StatusPedido.AGUARDANDO_APROVACAO, EnumSet.of(StatusPedido.AGUARDANDO_PAGAMENTO, StatusPedido.DIGITADO)),
                Map.entry(StatusPedido.AGUARDANDO_PAGAMENTO, EnumSet.of(StatusPedido.DIGITADO)),
                Map.entry(StatusPedido.DIGITADO, EnumSet.of(StatusPedido.IMPRESSO, StatusPedido.ESTOQUE, StatusPedido.SEPARACAO)),
                Map.entry(StatusPedido.IMPRESSO, EnumSet.of(StatusPedido.ESTOQUE, StatusPedido.SEPARACAO)),
                Map.entry(StatusPedido.ESTOQUE, EnumSet.of(StatusPedido.SEPARACAO, StatusPedido.SURFACAGEM_F5, StatusPedido.SURFACAGEM_FREEFORM, StatusPedido.CORTE)),
                Map.entry(StatusPedido.SEPARACAO, EnumSet.of(StatusPedido.SURFACAGEM_F5, StatusPedido.SURFACAGEM_FREEFORM, StatusPedido.ANTI_RISCO_SPIN, StatusPedido.COLORACAO, StatusPedido.TRATAMENTO, StatusPedido.CORTE, StatusPedido.MONTAGEM)),
                Map.entry(StatusPedido.SURFACAGEM_F5, EnumSet.of(StatusPedido.ANTI_RISCO_SPIN, StatusPedido.COLORACAO, StatusPedido.TRATAMENTO, StatusPedido.CORTE)),
                Map.entry(StatusPedido.SURFACAGEM_FREEFORM, EnumSet.of(StatusPedido.ANTI_RISCO_SPIN, StatusPedido.COLORACAO, StatusPedido.TRATAMENTO, StatusPedido.CORTE, StatusPedido.GRAVACAO)),
                Map.entry(StatusPedido.ANTI_RISCO_SPIN, EnumSet.of(StatusPedido.COLORACAO, StatusPedido.TRATAMENTO, StatusPedido.CORTE)),
                Map.entry(StatusPedido.COLORACAO, EnumSet.of(StatusPedido.ANTI_RISCO, StatusPedido.TRATAMENTO, StatusPedido.CORTE)),
                Map.entry(StatusPedido.ANTI_RISCO, EnumSet.of(StatusPedido.TRATAMENTO, StatusPedido.CORTE)),
                Map.entry(StatusPedido.TRATAMENTO, EnumSet.of(StatusPedido.CORTE, StatusPedido.GRAVACAO, StatusPedido.MONTAGEM)),
                Map.entry(StatusPedido.CORTE, EnumSet.of(StatusPedido.GRAVACAO, StatusPedido.MONTAGEM, StatusPedido.CONTROLE_QUALIDADE)),
                Map.entry(StatusPedido.GRAVACAO, EnumSet.of(StatusPedido.MONTAGEM, StatusPedido.CONTROLE_QUALIDADE)),
                Map.entry(StatusPedido.MONTAGEM, EnumSet.of(StatusPedido.CONTROLE_QUALIDADE, StatusPedido.DISTRIBUICAO)),
                Map.entry(StatusPedido.CONTROLE_QUALIDADE, EnumSet.of(StatusPedido.DISTRIBUICAO, StatusPedido.PRONTO)),
                Map.entry(StatusPedido.DISTRIBUICAO, EnumSet.of(StatusPedido.FINANCEIRO, StatusPedido.PRONTO, StatusPedido.ENTREGUE)),
                Map.entry(StatusPedido.FINANCEIRO, EnumSet.of(StatusPedido.PRONTO, StatusPedido.ENTREGUE)),
                Map.entry(StatusPedido.PRONTO, EnumSet.of(StatusPedido.ENTREGUE))
        );
        if (!permitidos.getOrDefault(atual, EnumSet.noneOf(StatusPedido.class)).contains(novo)) {
            throw new RegraNegocioException("Transição de status inválida: " + atual + " para " + novo);
        }
    }

    private String normalizarOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.strip();
    }

    public PedidoResponse toResponse(Pedido pedido) {
        Cliente cliente = pedido.getCliente();
        ClienteResponse clienteResponse = new ClienteResponse(
                cliente.getId(), cliente.getNome(), cliente.getCpf(), cliente.getTelefone(), cliente.getEmail(), cliente.getDataCadastro()
        );
        var itens = pedido.getItens().stream().map(item -> new ItemPedidoResponse(
                item.getId(), item.getProduto().getId(), item.getProduto().getNome(), item.getQuantidade(), item.getPrecoUnitario(), item.getSubtotal()
        )).toList();
        return new PedidoResponse(
                pedido.getId(), "OS-" + String.format("%06d", pedido.getId()), clienteResponse, itens,
                pedido.getValorTotal(), pedido.getStatus(), pedido.getPrioridade(), pedido.getDataPedido(), pedido.getDataPrevisao(),
                pedido.getOdEsferico(), pedido.getOdCilindrico(), pedido.getOdEixo(), pedido.getOdAdicao(), pedido.getOdDnp(), pedido.getOdAltura(),
                pedido.getOeEsferico(), pedido.getOeCilindrico(), pedido.getOeEixo(), pedido.getOeAdicao(), pedido.getOeDnp(), pedido.getOeAltura(),
                pedido.getTipoLente(), pedido.getMaterialLente(), pedido.getTratamento(), pedido.getArmacao(), pedido.getObservacoes()
        );
    }
}
