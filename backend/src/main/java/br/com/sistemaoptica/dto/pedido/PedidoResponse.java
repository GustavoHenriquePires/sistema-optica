package br.com.sistemaoptica.dto.pedido;

import br.com.sistemaoptica.dto.cliente.ClienteResponse;
import br.com.sistemaoptica.entity.StatusPedido;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponse(
        Long id,
        ClienteResponse cliente,
        List<ItemPedidoResponse> itens,
        BigDecimal valorTotal,
        StatusPedido status,
        LocalDateTime dataPedido,
        LocalDate dataPrevisao,
        String observacoes
) {
}
