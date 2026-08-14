package br.com.sistemaoptica.dto.pedido;

import br.com.sistemaoptica.entity.StatusPedido;

import java.time.LocalDateTime;

public record HistoricoStatusResponse(
        Long id,
        StatusPedido statusAnterior,
        StatusPedido statusNovo,
        String usuario,
        String observacao,
        LocalDateTime dataHora
) {
}
