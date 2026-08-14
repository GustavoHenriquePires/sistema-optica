package br.com.sistemaoptica.dto.pedido;

import br.com.sistemaoptica.dto.cliente.ClienteResponse;
import br.com.sistemaoptica.entity.PrioridadeOrdemServico;
import br.com.sistemaoptica.entity.StatusPedido;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponse(
        Long id,
        String numeroOs,
        ClienteResponse cliente,
        List<ItemPedidoResponse> itens,
        List<LentePedidoResponse> lentes,
        List<ServicoPedidoResponse> servicos,
        BigDecimal valorTotal,
        StatusPedido status,
        PrioridadeOrdemServico prioridade,
        LocalDateTime dataPedido,
        LocalDate dataPrevisao,
        BigDecimal odEsferico,
        BigDecimal odCilindrico,
        Integer odEixo,
        BigDecimal odAdicao,
        BigDecimal odDnp,
        BigDecimal odAltura,
        BigDecimal oeEsferico,
        BigDecimal oeCilindrico,
        Integer oeEixo,
        BigDecimal oeAdicao,
        BigDecimal oeDnp,
        BigDecimal oeAltura,
        String tipoLente,
        String materialLente,
        String tratamento,
        String armacao,
        String observacoes
) {}
