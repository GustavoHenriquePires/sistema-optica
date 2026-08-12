package br.com.sistemaoptica.dto.cliente;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CPF;

public record ClienteRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(min = 3, max = 120, message = "O nome deve ter entre 3 e 120 caracteres")
        String nome,

        @NotBlank(message = "O CPF é obrigatório")
        @Pattern(
                regexp = "^(?:\\d{11}|\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2})$",
                message = "O CPF deve conter 11 dígitos"
        )
        @CPF(message = "O CPF informado é inválido")
        String cpf,

        @NotBlank(message = "O telefone é obrigatório")
        @Pattern(
                regexp = "^(?:\\d{10,11}|\\(\\d{2}\\)\\s?\\d{4,5}-\\d{4})$",
                message = "Informe um telefone com DDD"
        )
        String telefone,

        @Email(message = "O e-mail informado é inválido")
        @Size(max = 150, message = "O e-mail deve ter no máximo 150 caracteres")
        String email
) {
}
