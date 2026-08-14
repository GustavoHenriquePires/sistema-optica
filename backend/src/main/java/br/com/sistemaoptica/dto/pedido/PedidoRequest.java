package br.com.sistemaoptica.dto.pedido;

import br.com.sistemaoptica.entity.PrioridadeOrdemServico;
import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PedidoRequest(
        @NotNull(message = "O cliente é obrigatório") Long clienteId,
        List<@Valid ItemPedidoRequest> itens,
        List<@Valid LentePedidoRequest> lentes,
        List<@Valid ServicoPedidoRequest> servicos,
        @FutureOrPresent(message = "A previsão de entrega não pode estar no passado") LocalDate dataPrevisao,
        PrioridadeOrdemServico prioridade,
        BigDecimal odEsferico,
        BigDecimal odCilindrico,
        @Min(0) @Max(180) Integer odEixo,
        BigDecimal odAdicao,
        BigDecimal odDnp,
        BigDecimal odAltura,
        BigDecimal oeEsferico,
        BigDecimal oeCilindrico,
        @Min(0) @Max(180) Integer oeEixo,
        BigDecimal oeAdicao,
        BigDecimal oeDnp,
        BigDecimal oeAltura,
        @Size(max = 120) String tipoLente,
        @Size(max = 80) String materialLente,
        @Size(max = 120) String tratamento,
        @Size(max = 120) String armacao,
        @Size(max = 1000, message = "As observações devem ter no máximo 1000 caracteres") String observacoes
) {}
