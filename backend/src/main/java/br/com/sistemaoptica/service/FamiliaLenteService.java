package br.com.sistemaoptica.service;

import br.com.sistemaoptica.dto.catalogo.FamiliaLenteRequest;
import br.com.sistemaoptica.dto.catalogo.FamiliaLenteResponse;
import br.com.sistemaoptica.entity.FamiliaLente;
import br.com.sistemaoptica.exception.RecursoNaoEncontradoException;
import br.com.sistemaoptica.exception.RegraNegocioException;
import br.com.sistemaoptica.repository.FamiliaLenteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
public class FamiliaLenteService {
    private final FamiliaLenteRepository repository;
    public FamiliaLenteService(FamiliaLenteRepository repository) { this.repository = repository; }

    @Transactional(readOnly = true)
    public List<FamiliaLenteResponse> listarAtivas() { return repository.findByAtivoTrueOrderByDescricaoAsc().stream().map(this::toResponse).toList(); }

    @Transactional
    public FamiliaLenteResponse criar(FamiliaLenteRequest request) {
        String codigo = request.codigo().strip().toUpperCase();
        repository.findByCodigoIgnoreCase(codigo).ifPresent(x -> { throw new RegraNegocioException("Já existe uma família de lente com o código " + codigo); });
        FamiliaLente e = new FamiliaLente(); preencher(e, request, codigo); return toResponse(repository.save(e));
    }

    @Transactional
    public FamiliaLenteResponse atualizar(Long id, FamiliaLenteRequest request) {
        FamiliaLente e = buscarEntidade(id); String codigo = request.codigo().strip().toUpperCase();
        repository.findByCodigoIgnoreCase(codigo).filter(x -> !x.getId().equals(id)).ifPresent(x -> { throw new RegraNegocioException("Já existe uma família de lente com o código " + codigo); });
        preencher(e, request, codigo); return toResponse(repository.save(e));
    }

    public FamiliaLente buscarEntidade(Long id) { return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Família de lente não encontrada com o ID " + id)); }

    private void preencher(FamiliaLente e, FamiliaLenteRequest r, String codigo) {
        e.setCodigo(codigo); e.setDescricao(r.descricao().strip()); e.setMaterial(normalizar(r.material())); e.setTecnologia(normalizar(r.tecnologia())); e.setTratamentoPadrao(normalizar(r.tratamentoPadrao())); e.setPrecoBase(r.precoBase() == null ? BigDecimal.ZERO : r.precoBase()); e.setAtivo(r.ativo() == null ? true : r.ativo());
    }
    private String normalizar(String v) { return v == null || v.isBlank() ? null : v.strip(); }
    private FamiliaLenteResponse toResponse(FamiliaLente e) { return new FamiliaLenteResponse(e.getId(), e.getCodigo(), e.getDescricao(), e.getMaterial(), e.getTecnologia(), e.getTratamentoPadrao(), e.getPrecoBase(), e.getAtivo()); }
}
