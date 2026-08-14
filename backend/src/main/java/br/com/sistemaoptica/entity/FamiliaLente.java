package br.com.sistemaoptica.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "familias_lente")
public class FamiliaLente {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 40) private String codigo;
    @Column(nullable = false, length = 160) private String descricao;
    @Column(length = 60) private String material;
    @Column(length = 80) private String tecnologia;
    @Column(length = 80) private String tratamentoPadrao;
    @Column(precision = 12, scale = 2) private BigDecimal precoBase;
    @Column(nullable = false) private Boolean ativo = true;

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getMaterial() { return material; }
    public void setMaterial(String material) { this.material = material; }
    public String getTecnologia() { return tecnologia; }
    public void setTecnologia(String tecnologia) { this.tecnologia = tecnologia; }
    public String getTratamentoPadrao() { return tratamentoPadrao; }
    public void setTratamentoPadrao(String tratamentoPadrao) { this.tratamentoPadrao = tratamentoPadrao; }
    public BigDecimal getPrecoBase() { return precoBase; }
    public void setPrecoBase(BigDecimal precoBase) { this.precoBase = precoBase; }
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
