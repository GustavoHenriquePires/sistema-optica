package br.com.sistemaoptica.service;

import br.com.sistemaoptica.dto.common.PaginaResponse;
import br.com.sistemaoptica.dto.produto.EstoqueRequest;
import br.com.sistemaoptica.dto.produto.ProdutoRequest;
import br.com.sistemaoptica.dto.produto.ProdutoResponse;
import br.com.sistemaoptica.entity.CategoriaProduto;
import br.com.sistemaoptica.entity.Produto;
import br.com.sistemaoptica.exception.RecursoNaoEncontradoException;
import br.com.sistemaoptica.repository.ProdutoRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;

    public ProdutoService(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ProdutoResponse> listar(
            String nome,
            CategoriaProduto categoria,
            Boolean ativo,
            Pageable pageable
    ) {
        String nomeNormalizado = nome == null || nome.isBlank() ? null : nome.strip();
        return PaginaResponse.from(produtoRepository
                .buscar(nomeNormalizado, categoria, ativo, pageable)
                .map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public ProdutoResponse buscarPorId(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public ProdutoResponse criar(ProdutoRequest request) {
        Produto produto = new Produto();
        aplicarDados(produto, request);
        return toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponse atualizar(Long id, ProdutoRequest request) {
        Produto produto = buscarEntidade(id);
        aplicarDados(produto, request);
        return toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponse atualizarEstoque(Long id, EstoqueRequest request) {
        Produto produto = buscarEntidade(id);
        produto.setQuantidadeEstoque(request.quantidadeEstoque());
        return toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public void excluir(Long id) {
        produtoRepository.delete(buscarEntidade(id));
    }

    public Produto buscarEntidade(Long id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Produto não encontrado com o ID " + id
                ));
    }

    private void aplicarDados(Produto produto, ProdutoRequest request) {
        produto.setNome(normalizarTexto(request.nome()));
        produto.setCategoria(request.categoria());
        produto.setMarca(normalizarOpcional(request.marca()));
        produto.setDescricao(normalizarOpcional(request.descricao()));
        produto.setPreco(request.preco());
        produto.setQuantidadeEstoque(request.quantidadeEstoque());
        produto.setAtivo(request.ativo());
    }

    private String normalizarTexto(String valor) {
        return valor.strip().replaceAll("\\s+", " ");
    }

    private String normalizarOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : normalizarTexto(valor);
    }

    public ProdutoResponse toResponse(Produto produto) {
        return new ProdutoResponse(
                produto.getId(),
                produto.getNome(),
                produto.getCategoria(),
                produto.getMarca(),
                produto.getDescricao(),
                produto.getPreco(),
                produto.getQuantidadeEstoque(),
                produto.getAtivo(),
                produto.getDataCadastro()
        );
    }
}
