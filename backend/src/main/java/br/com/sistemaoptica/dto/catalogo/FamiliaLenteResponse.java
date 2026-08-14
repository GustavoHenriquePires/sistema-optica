package br.com.sistemaoptica.dto.catalogo;

import java.math.BigDecimal;

public record FamiliaLenteResponse(Long id, String codigo, String descricao, String material, String tecnologia, String tratamentoPadrao, BigDecimal precoBase, Boolean ativo) {}
