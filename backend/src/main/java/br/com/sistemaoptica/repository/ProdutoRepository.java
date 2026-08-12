package br.com.sistemaoptica.repository;

import br.com.sistemaoptica.entity.CategoriaProduto;
import br.com.sistemaoptica.entity.Produto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    @Query("""
            select p from Produto p
            where (:nome is null or lower(p.nome) like lower(concat('%', :nome, '%')))
              and (:categoria is null or p.categoria = :categoria)
              and (:ativo is null or p.ativo = :ativo)
            """)
    Page<Produto> buscar(
            @Param("nome") String nome,
            @Param("categoria") CategoriaProduto categoria,
            @Param("ativo") Boolean ativo,
            Pageable pageable
    );

    long countByAtivoTrue();

    long countByQuantidadeEstoqueLessThanEqualAndAtivoTrue(Integer quantidade);
}
