package br.com.sistemaoptica.dto.pedido;

import br.com.sistemaoptica.entity.Olho;
import java.math.BigDecimal;

public record LentePedidoResponse(
        Long id,
        Olho olho,
        Long familiaLenteId,
        String codigo,
        String descricao,
        BigDecimal preco,
        Boolean blocoFornecido,
        String observacao
) {}
