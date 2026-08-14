package br.com.sistemaoptica.dto.pedido;

import br.com.sistemaoptica.entity.Olho;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record LentePedidoRequest(
        @NotNull Olho olho,
        @NotNull Long familiaLenteId,
        BigDecimal preco,
        Boolean blocoFornecido,
        @Size(max = 250) String observacao
) {}
