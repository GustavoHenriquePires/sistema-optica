package br.com.sistemaoptica.dto.dashboard;

import br.com.sistemaoptica.dto.pedido.PedidoResponse;

import java.util.List;

public record DashboardResponse(
        long totalClientes,
        long totalPedidos,
        long pedidosEmProducao,
        long pedidosProntos,
        long produtosCadastrados,
        long produtosEstoqueBaixo,
        List<PedidoResponse> pedidosRecentes
) {
}
