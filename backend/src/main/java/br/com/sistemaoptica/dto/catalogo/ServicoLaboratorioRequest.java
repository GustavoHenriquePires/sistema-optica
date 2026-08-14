package br.com.sistemaoptica.dto.catalogo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ServicoLaboratorioRequest(
        @NotBlank @Size(max = 40) String codigo,
        @NotBlank @Size(max = 160) String descricao,
        @Size(max = 80) String setor,
        @PositiveOrZero BigDecimal preco,
        Boolean ativo
) {}
