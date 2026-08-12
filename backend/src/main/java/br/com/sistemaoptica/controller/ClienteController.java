package br.com.sistemaoptica.controller;

import br.com.sistemaoptica.dto.cliente.ClienteRequest;
import br.com.sistemaoptica.dto.cliente.ClienteResponse;
import br.com.sistemaoptica.dto.common.PaginaResponse;
import br.com.sistemaoptica.service.ClienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/clientes")
@Tag(name = "Clientes", description = "Cadastro e consulta de clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @PostMapping
    @Operation(summary = "Cadastrar cliente")
    public ResponseEntity<ClienteResponse> criar(@Valid @RequestBody ClienteRequest request) {
        ClienteResponse cliente = clienteService.criar(request);
        return ResponseEntity
                .created(URI.create("/clientes/" + cliente.id()))
                .body(cliente);
    }

    @GetMapping
    @Operation(summary = "Listar ou pesquisar clientes")
    public PaginaResponse<ClienteResponse> listar(
            @RequestParam(required = false) String nome,
            @PageableDefault(size = 20, sort = "nome") Pageable pageable
    ) {
        return clienteService.listar(nome, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar cliente por ID")
    public ClienteResponse buscarPorId(@PathVariable Long id) {
        return clienteService.buscarPorId(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar cliente")
    public ClienteResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ClienteRequest request
    ) {
        return clienteService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir cliente")
    public void excluir(@PathVariable Long id) {
        clienteService.excluir(id);
    }
}
