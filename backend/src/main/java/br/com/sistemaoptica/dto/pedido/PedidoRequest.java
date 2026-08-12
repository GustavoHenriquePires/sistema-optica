package br.com.sistemaoptica.dto.pedido;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record PedidoRequest(
        @NotNull(message = "O cliente é obrigatório")
        Long clienteId,

        @NotEmpty(message = "O pedido deve possuir pelo menos um item")
        List<@Valid ItemPedidoRequest> itens,

        @FutureOrPresent(message = "A previsão de entrega não pode estar no passado")
        LocalDate dataPrevisao,

        @Size(max = 1000, message = "As observações devem ter no máximo 1000 caracteres")
        String observacoes
) {
}
