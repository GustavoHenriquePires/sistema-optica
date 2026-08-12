package br.com.sistemaoptica.service;

import br.com.sistemaoptica.dto.dashboard.DashboardResponse;
import br.com.sistemaoptica.entity.StatusPedido;
import br.com.sistemaoptica.repository.ClienteRepository;
import br.com.sistemaoptica.repository.PedidoRepository;
import br.com.sistemaoptica.repository.ProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final ClienteRepository clienteRepository;
    private final PedidoRepository pedidoRepository;
    private final ProdutoRepository produtoRepository;
    private final PedidoService pedidoService;

    public DashboardService(ClienteRepository clienteRepository, PedidoRepository pedidoRepository, ProdutoRepository produtoRepository, PedidoService pedidoService) {
        this.clienteRepository = clienteRepository;
        this.pedidoRepository = pedidoRepository;
        this.produtoRepository = produtoRepository;
        this.pedidoService = pedidoService;
    }

    @Transactional(readOnly = true)
    public DashboardResponse obterResumo() {
        return new DashboardResponse(
                clienteRepository.count(),
                pedidoRepository.count(),
                pedidoRepository.countByStatus(StatusPedido.EM_PRODUCAO),
                pedidoRepository.countByStatus(StatusPedido.PRONTO),
                produtoRepository.countByAtivoTrue(),
                produtoRepository.countByQuantidadeEstoqueLessThanEqualAndAtivoTrue(5),
                pedidoRepository.findTop5ByOrderByDataPedidoDesc().stream().map(pedidoService::toResponse).toList()
        );
    }
}
