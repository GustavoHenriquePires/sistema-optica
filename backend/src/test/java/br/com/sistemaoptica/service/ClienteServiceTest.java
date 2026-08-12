package br.com.sistemaoptica.service;

import br.com.sistemaoptica.dto.cliente.ClienteRequest;
import br.com.sistemaoptica.dto.cliente.ClienteResponse;
import br.com.sistemaoptica.entity.Cliente;
import br.com.sistemaoptica.exception.RecursoNaoEncontradoException;
import br.com.sistemaoptica.exception.RegraNegocioException;
import br.com.sistemaoptica.repository.ClienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {

    @Mock
    private ClienteRepository clienteRepository;

    private ClienteService clienteService;

    @BeforeEach
    void setUp() {
        clienteService = new ClienteService(clienteRepository);
    }

    @Test
    void deveCriarClienteComDadosNormalizados() {
        ClienteRequest request = new ClienteRequest(
                "  Ana   Souza  ",
                "529.982.247-25",
                "(67) 99999-9999",
                "  ANA@EXAMPLE.COM "
        );
        when(clienteRepository.existsByCpf("52998224725")).thenReturn(false);
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(invocation -> {
            Cliente cliente = invocation.getArgument(0);
            cliente.setId(1L);
            cliente.setDataCadastro(LocalDateTime.of(2026, 8, 11, 20, 0));
            return cliente;
        });

        ClienteResponse response = clienteService.criar(request);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.nome()).isEqualTo("Ana Souza");
        assertThat(response.cpf()).isEqualTo("52998224725");
        assertThat(response.telefone()).isEqualTo("67999999999");
        assertThat(response.email()).isEqualTo("ana@example.com");
    }

    @Test
    void naoDeveCriarClienteQuandoCpfJaExiste() {
        ClienteRequest request = new ClienteRequest(
                "Ana Souza",
                "52998224725",
                "67999999999",
                "ana@example.com"
        );
        when(clienteRepository.existsByCpf("52998224725")).thenReturn(true);

        assertThatThrownBy(() -> clienteService.criar(request))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessage("Já existe um cliente cadastrado com este CPF");

        verify(clienteRepository, never()).save(any(Cliente.class));
    }

    @Test
    void deveRetornarErroAoBuscarClienteInexistente() {
        when(clienteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> clienteService.buscarPorId(99L))
                .isInstanceOf(RecursoNaoEncontradoException.class)
                .hasMessage("Cliente não encontrado com o ID 99");
    }

    @Test
    void deveExcluirClienteExistente() {
        Cliente cliente = new Cliente();
        cliente.setId(10L);
        when(clienteRepository.findById(10L)).thenReturn(Optional.of(cliente));

        clienteService.excluir(10L);

        verify(clienteRepository).delete(cliente);
    }
}
