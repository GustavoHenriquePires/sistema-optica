package br.com.sistemaoptica.repository;

import br.com.sistemaoptica.entity.ServicoLaboratorio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ServicoLaboratorioRepository extends JpaRepository<ServicoLaboratorio, Long> {
    Optional<ServicoLaboratorio> findByCodigoIgnoreCase(String codigo);
    List<ServicoLaboratorio> findByAtivoTrueOrderByDescricaoAsc();
}
