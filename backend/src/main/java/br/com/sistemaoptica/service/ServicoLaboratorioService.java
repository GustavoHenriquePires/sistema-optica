package br.com.sistemaoptica.service;

import br.com.sistemaoptica.dto.catalogo.ServicoLaboratorioRequest;
import br.com.sistemaoptica.dto.catalogo.ServicoLaboratorioResponse;
import br.com.sistemaoptica.entity.ServicoLaboratorio;
import br.com.sistemaoptica.exception.RecursoNaoEncontradoException;
import br.com.sistemaoptica.exception.RegraNegocioException;
import br.com.sistemaoptica.repository.ServicoLaboratorioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
public class ServicoLaboratorioService {
    private final ServicoLaboratorioRepository repository;
    public ServicoLaboratorioService(ServicoLaboratorioRepository repository) { this.repository = repository; }

    @Transactional(readOnly = true)
    public List<ServicoLaboratorioResponse> listarAtivos() { return repository.findByAtivoTrueOrderByDescricaoAsc().stream().map(this::toResponse).toList(); }

    @Transactional
    public ServicoLaboratorioResponse criar(ServicoLaboratorioRequest request) {
        String codigo = request.codigo().strip().toUpperCase();
        repository.findByCodigoIgnoreCase(codigo).ifPresent(x -> { throw new RegraNegocioException("Já existe um serviço com o código " + codigo); });
        ServicoLaboratorio e = new ServicoLaboratorio(); preencher(e, request, codigo); return toResponse(repository.save(e));
    }

    @Transactional
    public ServicoLaboratorioResponse atualizar(Long id, ServicoLaboratorioRequest request) {
        ServicoLaboratorio e = buscarEntidade(id); String codigo = request.codigo().strip().toUpperCase();
        repository.findByCodigoIgnoreCase(codigo).filter(x -> !x.getId().equals(id)).ifPresent(x -> { throw new RegraNegocioException("Já existe um serviço com o código " + codigo); });
        preencher(e, request, codigo); return toResponse(repository.save(e));
    }

    public ServicoLaboratorio buscarEntidade(Long id) { return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado com o ID " + id)); }

    private void preencher(ServicoLaboratorio e, ServicoLaboratorioRequest r, String codigo) {
        e.setCodigo(codigo); e.setDescricao(r.descricao().strip()); e.setSetor(normalizar(r.setor())); e.setPreco(r.preco() == null ? BigDecimal.ZERO : r.preco()); e.setAtivo(r.ativo() == null ? true : r.ativo());
    }
    private String normalizar(String v) { return v == null || v.isBlank() ? null : v.strip(); }
    private ServicoLaboratorioResponse toResponse(ServicoLaboratorio e) { return new ServicoLaboratorioResponse(e.getId(), e.getCodigo(), e.getDescricao(), e.getSetor(), e.getPreco(), e.getAtivo()); }
}
