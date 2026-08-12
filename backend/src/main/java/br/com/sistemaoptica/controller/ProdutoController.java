package br.com.sistemaoptica.controller;

import br.com.sistemaoptica.dto.common.PaginaResponse;
import br.com.sistemaoptica.dto.produto.EstoqueRequest;
import br.com.sistemaoptica.dto.produto.ProdutoRequest;
import br.com.sistemaoptica.dto.produto.ProdutoResponse;
import br.com.sistemaoptica.entity.CategoriaProduto;
import br.com.sistemaoptica.service.ProdutoService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/produtos")
@Tag(name = "Produtos", description = "Cadastro e controle de estoque dos produtos")
public class ProdutoController {

    private final ProdutoService produtoService;

    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @PostMapping
    @Operation(summary = "Cadastrar produto")
    public ResponseEntity<ProdutoResponse> criar(@Valid @RequestBody ProdutoRequest request) {
        ProdutoResponse produto = produtoService.criar(request);
        return ResponseEntity.created(URI.create("/produtos/" + produto.id())).body(produto);
    }

    @GetMapping
    @Operation(summary = "Listar ou filtrar produtos")
    public PaginaResponse<ProdutoResponse> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) CategoriaProduto categoria,
            @RequestParam(required = false) Boolean ativo,
            @PageableDefault(size = 20, sort = "nome") Pageable pageable
    ) {
        return produtoService.listar(nome, categoria, ativo, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar produto por ID")
    public ProdutoResponse buscarPorId(@PathVariable Long id) {
        return produtoService.buscarPorId(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar produto")
    public ProdutoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ProdutoRequest request
    ) {
        return produtoService.atualizar(id, request);
    }

    @PatchMapping("/{id}/estoque")
    @Operation(summary = "Atualizar quantidade em estoque")
    public ProdutoResponse atualizarEstoque(
            @PathVariable Long id,
            @Valid @RequestBody EstoqueRequest request
    ) {
        return produtoService.atualizarEstoque(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir produto")
    public void excluir(@PathVariable Long id) {
        produtoService.excluir(id);
    }
}
