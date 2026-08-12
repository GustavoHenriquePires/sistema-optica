package br.com.sistemaoptica.dto.pedido;

import br.com.sistemaoptica.entity.StatusPedido;
import jakarta.validation.constraints.NotNull;

public record StatusPedidoRequest(
        @NotNull(message = "O status é obrigatório")
        StatusPedido status
) {
}
