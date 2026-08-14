package br.com.sistemaoptica.repository;

import br.com.sistemaoptica.entity.FamiliaLente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FamiliaLenteRepository extends JpaRepository<FamiliaLente, Long> {
    Optional<FamiliaLente> findByCodigoIgnoreCase(String codigo);
    List<FamiliaLente> findByAtivoTrueOrderByDescricaoAsc();
}
