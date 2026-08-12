package br.com.sistemaoptica.service;

import br.com.sistemaoptica.dto.cliente.ClienteRequest;
import br.com.sistemaoptica.dto.cliente.ClienteResponse;
import br.com.sistemaoptica.dto.common.PaginaResponse;
import br.com.sistemaoptica.entity.Cliente;
import br.com.sistemaoptica.exception.RecursoNaoEncontradoException;
import br.com.sistemaoptica.exception.RegraNegocioException;
import br.com.sistemaoptica.repository.ClienteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ClienteResponse> listar(String nome, Pageable pageable) {
        Page<Cliente> clientes = nome == null || nome.isBlank()
                ? clienteRepository.findAll(pageable)
                : clienteRepository.findByNomeContainingIgnoreCase(nome.strip(), pageable);

        return PaginaResponse.from(clientes.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public ClienteResponse buscarPorId(Long id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public ClienteResponse criar(ClienteRequest request) {
        String cpfNormalizado = somenteDigitos(request.cpf());
        validarCpfDisponivel(cpfNormalizado, null);

        Cliente cliente = new Cliente();
        aplicarDados(cliente, request, cpfNormalizado);
        return toResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponse atualizar(Long id, ClienteRequest request) {
        Cliente cliente = buscarEntidade(id);
        String cpfNormalizado = somenteDigitos(request.cpf());
        validarCpfDisponivel(cpfNormalizado, id);

        aplicarDados(cliente, request, cpfNormalizado);
        return toResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public void excluir(Long id) {
        Cliente cliente = buscarEntidade(id);
        clienteRepository.delete(cliente);
    }

    public Cliente buscarEntidade(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Cliente não encontrado com o ID " + id
                ));
    }

    private void validarCpfDisponivel(String cpf, Long clienteId) {
        boolean cpfEmUso = clienteId == null
                ? clienteRepository.existsByCpf(cpf)
                : clienteRepository.existsByCpfAndIdNot(cpf, clienteId);

        if (cpfEmUso) {
            throw new RegraNegocioException("Já existe um cliente cadastrado com este CPF");
        }
    }

    private void aplicarDados(Cliente cliente, ClienteRequest request, String cpfNormalizado) {
        cliente.setNome(normalizarNome(request.nome()));
        cliente.setCpf(cpfNormalizado);
        cliente.setTelefone(somenteDigitos(request.telefone()));
        cliente.setEmail(normalizarEmail(request.email()));
    }

    private String normalizarNome(String nome) {
        return nome.strip().replaceAll("\\s+", " ");
    }

    private String normalizarEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.strip().toLowerCase(Locale.ROOT);
    }

    private String somenteDigitos(String valor) {
        return valor.replaceAll("\\D", "");
    }

    private ClienteResponse toResponse(Cliente cliente) {
        return new ClienteResponse(
                cliente.getId(),
                cliente.getNome(),
                cliente.getCpf(),
                cliente.getTelefone(),
                cliente.getEmail(),
                cliente.getDataCadastro()
        );
    }
}
