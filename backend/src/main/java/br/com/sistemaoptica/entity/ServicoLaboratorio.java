package br.com.sistemaoptica.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "servicos_laboratorio")
public class ServicoLaboratorio {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 40) private String codigo;
    @Column(nullable = false, length = 160) private String descricao;
    @Column(length = 80) private String setor;
    @Column(precision = 12, scale = 2) private BigDecimal preco;
    @Column(nullable = false) private Boolean ativo = true;

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getSetor() { return setor; }
    public void setSetor(String setor) { this.setor = setor; }
    public BigDecimal getPreco() { return preco; }
    public void setPreco(BigDecimal preco) { this.preco = preco; }
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
