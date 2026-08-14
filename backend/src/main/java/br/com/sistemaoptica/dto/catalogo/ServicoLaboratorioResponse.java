package br.com.sistemaoptica.dto.catalogo;

import java.math.BigDecimal;

public record ServicoLaboratorioResponse(Long id, String codigo, String descricao, String setor, BigDecimal preco, Boolean ativo) {}
