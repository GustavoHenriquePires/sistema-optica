package br.com.sistemaoptica.controller;

import br.com.sistemaoptica.dto.catalogo.ServicoLaboratorioRequest;
import br.com.sistemaoptica.dto.catalogo.ServicoLaboratorioResponse;
import br.com.sistemaoptica.service.ServicoLaboratorioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/servicos-laboratorio")
@Tag(name = "Serviços do laboratório", description = "Catálogo de serviços executados no fluxo produtivo")
public class ServicoLaboratorioController {
    private final ServicoLaboratorioService service;
    public ServicoLaboratorioController(ServicoLaboratorioService service) { this.service = service; }

    @GetMapping
    @Operation(summary = "Listar serviços ativos")
    public List<ServicoLaboratorioResponse> listar() { return service.listarAtivos(); }

    @PostMapping
    @Operation(summary = "Cadastrar serviço do laboratório")
    public ResponseEntity<ServicoLaboratorioResponse> criar(@Valid @RequestBody ServicoLaboratorioRequest request) {
        ServicoLaboratorioResponse response = service.criar(request);
        return ResponseEntity.created(URI.create("/servicos-laboratorio/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar serviço do laboratório")
    public ServicoLaboratorioResponse atualizar(@PathVariable Long id, @Valid @RequestBody ServicoLaboratorioRequest request) { return service.atualizar(id, request); }
}
