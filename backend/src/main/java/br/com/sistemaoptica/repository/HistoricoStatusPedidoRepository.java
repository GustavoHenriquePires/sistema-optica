package br.com.sistemaoptica.repository;

import br.com.sistemaoptica.entity.HistoricoStatusPedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistoricoStatusPedidoRepository extends JpaRepository<HistoricoStatusPedido, Long> {
    List<HistoricoStatusPedido> findByPedidoIdOrderByDataHoraAsc(Long pedidoId);
}
