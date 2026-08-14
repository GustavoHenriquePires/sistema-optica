package br.com.sistemaoptica.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lentes_pedido", uniqueConstraints = @UniqueConstraint(columnNames = {"pedido_id", "olho"}))
public class LentePedido {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 2)
    private Olho olho;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "familia_lente_id", nullable = false)
    private FamiliaLente familiaLente;

    @Column(precision = 12, scale = 2)
    private BigDecimal preco;

    @Column(nullable = false)
    private Boolean blocoFornecido = false;

    @Column(length = 250)
    private String observacao;

    public Long getId() { return id; }
    public Pedido getPedido() { return pedido; }
    public void setPedido(Pedido pedido) { this.pedido = pedido; }
    public Olho getOlho() { return olho; }
    public void setOlho(Olho olho) { this.olho = olho; }
    public FamiliaLente getFamiliaLente() { return familiaLente; }
    public void setFamiliaLente(FamiliaLente familiaLente) { this.familiaLente = familiaLente; }
    public BigDecimal getPreco() { return preco; }
    public void setPreco(BigDecimal preco) { this.preco = preco; }
    public Boolean getBlocoFornecido() { return blocoFornecido; }
    public void setBlocoFornecido(Boolean blocoFornecido) { this.blocoFornecido = blocoFornecido; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
}
