package br.com.sistemaoptica.repository;

import br.com.sistemaoptica.entity.Pedido;
import br.com.sistemaoptica.entity.StatusPedido;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @EntityGraph(attributePaths = {"cliente"})
    @Query("""
            select distinct p from Pedido p
            where (:status is null or p.status = :status)
              and (:cliente is null or lower(p.cliente.nome) like lower(concat('%', :cliente, '%')))
            """)
    Page<Pedido> buscar(@Param("status") StatusPedido status, @Param("cliente") String cliente, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"cliente", "itens", "itens.produto"})
    java.util.Optional<Pedido> findById(Long id);

    long countByStatus(StatusPedido status);

    @EntityGraph(attributePaths = {"cliente"})
    List<Pedido> findTop5ByOrderByDataPedidoDesc();
}
