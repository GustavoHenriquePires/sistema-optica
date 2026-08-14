package br.com.sistemaoptica.dto.pedido;

import br.com.sistemaoptica.entity.StatusPedido;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EtapaPedidoRequest(
        @NotNull StatusPedido status,
        @Size(max = 120) String usuario,
        @Size(max = 500) String observacao
) {
}
