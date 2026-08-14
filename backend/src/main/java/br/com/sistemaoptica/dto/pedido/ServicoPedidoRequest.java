package br.com.sistemaoptica.dto.pedido;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ServicoPedidoRequest(
        @NotNull Long servicoId,
        @Min(1) Integer quantidade,
        BigDecimal precoUnitario
) {}
