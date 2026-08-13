package br.com.sistemaoptica.service;

import br.com.sistemaoptica.dto.cliente.ClienteResponse;
import br.com.sistemaoptica.dto.common.PaginaResponse;
import br.com.sistemaoptica.dto.pedido.ItemPedidoRequest;
import br.com.sistemaoptica.dto.pedido.ItemPedidoResponse;
import br.com.sistemaoptica.dto.pedido.PedidoRequest;
import br.com.sistemaoptica.dto.pedido.PedidoResponse;
import br.com.sistemaoptica.dto.pedido.StatusPedidoRequest;
import br.com.sistemaoptica.entity.Cliente;
import br.com.sistemaoptica.entity.ItemPedido;
import br.com.sistemaoptica.entity.Pedido;
import br.com.sistemaoptica.entity.PrioridadeOrdemServico;
import br.com.sistemaoptica.entity.Produto;
import br.com.sistemaoptica.entity.StatusPedido;
import br.com.sistemaoptica.exception.RecursoNaoEncontradoException;
import br.com.sistemaoptica.exception.RegraNegocioException;
import br.com.sistemaoptica.repository.PedidoRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteService clienteService;
    private final ProdutoService produtoService;

    public PedidoService(PedidoRepository pedidoRepository, ClienteService clienteService, ProdutoService produtoService) {
        this.pedidoRepository = pedidoRepository;
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
        return toResponse(pedidoRepository.save(pedido));
    }

    @Transactional
    public PedidoResponse atualizarStatus(Long id, StatusPedidoRequest request) {
        Pedido pedido = buscarEntidade(id);
        if (pedido.getStatus() == request.status()) return toResponse(pedido);
        validarTransicao(pedido.getStatus(), request.status());

        if (request.status() == StatusPedido.CANCELADO) {
            pedido.getItens().forEach(item -> item.getProduto().setQuantidadeEstoque(
                    item.getProduto().getQuantidadeEstoque() + item.getQuantidade()
            ));
        }
        pedido.setStatus(request.status());
        return toResponse(pedidoRepository.save(pedido));
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
        if (novo == StatusPedido.CANCELADO) return;

        Map<StatusPedido, EnumSet<StatusPedido>> permitidos = Map.of(
                StatusPedido.RECEBIDO, EnumSet.of(StatusPedido.EM_PRODUCAO),
                StatusPedido.EM_PRODUCAO, EnumSet.of(StatusPedido.PRONTO),
                StatusPedido.PRONTO, EnumSet.of(StatusPedido.ENTREGUE)
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
