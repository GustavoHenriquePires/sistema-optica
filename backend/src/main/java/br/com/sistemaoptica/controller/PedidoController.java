package br.com.sistemaoptica.controller;

import br.com.sistemaoptica.dto.common.PaginaResponse;
import br.com.sistemaoptica.dto.pedido.EtapaPedidoRequest;
import br.com.sistemaoptica.dto.pedido.HistoricoStatusResponse;
import br.com.sistemaoptica.dto.pedido.PedidoRequest;
import br.com.sistemaoptica.dto.pedido.PedidoResponse;
import br.com.sistemaoptica.dto.pedido.StatusPedidoRequest;
import br.com.sistemaoptica.entity.StatusPedido;
import br.com.sistemaoptica.service.PedidoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/pedidos")
@Tag(name = "Ordens de serviço", description = "Registro e acompanhamento das ordens de serviço do laboratório óptico")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) { this.pedidoService = pedidoService; }

    @PostMapping
    @Operation(summary = "Registrar uma nova ordem de serviço")
    public ResponseEntity<PedidoResponse> criar(@Valid @RequestBody PedidoRequest request) {
        PedidoResponse pedido = pedidoService.criar(request);
        return ResponseEntity.created(URI.create("/pedidos/" + pedido.id())).body(pedido);
    }

    @GetMapping
    @Operation(summary = "Listar ou filtrar ordens de serviço")
    public PaginaResponse<PedidoResponse> listar(
            @RequestParam(required = false) StatusPedido status,
            @RequestParam(required = false) String cliente,
            @PageableDefault(size = 20, sort = "dataPedido") Pageable pageable
    ) { return pedidoService.listar(status, cliente, pageable); }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar ordem de serviço por ID")
    public PedidoResponse buscar(@PathVariable Long id) { return pedidoService.buscarPorId(id); }

    @GetMapping("/{id}/historico")
    @Operation(summary = "Consultar o histórico produtivo da ordem de serviço")
    public List<HistoricoStatusResponse> historico(@PathVariable Long id) {
        return pedidoService.listarHistorico(id);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar o status da ordem de serviço (compatibilidade)")
    public PedidoResponse atualizarStatus(@PathVariable Long id, @Valid @RequestBody StatusPedidoRequest request) {
        return pedidoService.atualizarStatus(id, request);
    }

    @PatchMapping("/{id}/etapa")
    @Operation(summary = "Avançar a OS no fluxo produtivo registrando operador e observação")
    public PedidoResponse avancarEtapa(@PathVariable Long id, @Valid @RequestBody EtapaPedidoRequest request) {
        return pedidoService.avancarEtapa(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir ordem de serviço cancelada")
    public void excluir(@PathVariable Long id) { pedidoService.excluir(id); }
}
