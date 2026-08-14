package br.com.sistemaoptica.dto.pedido;

import java.math.BigDecimal;

public record ServicoPedidoResponse(
        Long id,
        Long servicoId,
        String codigo,
        String descricao,
        String setor,
        Integer quantidade,
        BigDecimal precoUnitario,
        BigDecimal subtotal
) {}
