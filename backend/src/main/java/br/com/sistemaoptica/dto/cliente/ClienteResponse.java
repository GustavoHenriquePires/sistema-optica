package br.com.sistemaoptica.dto.cliente;

import java.time.LocalDateTime;

public record ClienteResponse(
        Long id,
        String nome,
        String cpf,
        String telefone,
        String email,
        LocalDateTime dataCadastro
) {
}
