package br.com.sistemaoptica.controller;

import br.com.sistemaoptica.dto.catalogo.FamiliaLenteRequest;
import br.com.sistemaoptica.dto.catalogo.FamiliaLenteResponse;
import br.com.sistemaoptica.service.FamiliaLenteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/familias-lente")
@Tag(name = "Famílias de lentes", description = "Catálogo comercial e técnico de famílias de lentes")
public class FamiliaLenteController {
    private final FamiliaLenteService service;
    public FamiliaLenteController(FamiliaLenteService service) { this.service = service; }

    @GetMapping
    @Operation(summary = "Listar famílias de lentes ativas")
    public List<FamiliaLenteResponse> listar() { return service.listarAtivas(); }

    @PostMapping
    @Operation(summary = "Cadastrar família de lente")
    public ResponseEntity<FamiliaLenteResponse> criar(@Valid @RequestBody FamiliaLenteRequest request) {
        FamiliaLenteResponse response = service.criar(request);
        return ResponseEntity.created(URI.create("/familias-lente/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar família de lente")
    public FamiliaLenteResponse atualizar(@PathVariable Long id, @Valid @RequestBody FamiliaLenteRequest request) { return service.atualizar(id, request); }
}
