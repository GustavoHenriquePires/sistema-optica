package br.com.sistemaoptica.dto.produto;

import br.com.sistemaoptica.entity.CategoriaProduto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProdutoResponse(
        Long id,
        String nome,
        CategoriaProduto categoria,
        String marca,
        String descricao,
        BigDecimal preco,
        Integer quantidadeEstoque,
        Boolean ativo,
        LocalDateTime dataCadastro
) {
}
