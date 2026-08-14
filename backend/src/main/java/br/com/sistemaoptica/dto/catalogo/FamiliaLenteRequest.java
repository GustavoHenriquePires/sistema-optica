package br.com.sistemaoptica.dto.catalogo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record FamiliaLenteRequest(
        @NotBlank @Size(max = 40) String codigo,
        @NotBlank @Size(max = 160) String descricao,
        @Size(max = 60) String material,
        @Size(max = 80) String tecnologia,
        @Size(max = 80) String tratamentoPadrao,
        @PositiveOrZero BigDecimal precoBase,
        Boolean ativo
) {}
