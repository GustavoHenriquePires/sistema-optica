package br.com.sistemaoptica.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemPedido> itens = new ArrayList<>();

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusPedido status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private PrioridadeOrdemServico prioridade;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataPedido;

    private LocalDate dataPrevisao;

    @Column(precision = 6, scale = 2) private BigDecimal odEsferico;
    @Column(precision = 6, scale = 2) private BigDecimal odCilindrico;
    private Integer odEixo;
    @Column(precision = 6, scale = 2) private BigDecimal odAdicao;
    @Column(precision = 6, scale = 2) private BigDecimal odDnp;
    @Column(precision = 6, scale = 2) private BigDecimal odAltura;

    @Column(precision = 6, scale = 2) private BigDecimal oeEsferico;
    @Column(precision = 6, scale = 2) private BigDecimal oeCilindrico;
    private Integer oeEixo;
    @Column(precision = 6, scale = 2) private BigDecimal oeAdicao;
    @Column(precision = 6, scale = 2) private BigDecimal oeDnp;
    @Column(precision = 6, scale = 2) private BigDecimal oeAltura;

    @Column(length = 120) private String tipoLente;
    @Column(length = 80) private String materialLente;
    @Column(length = 120) private String tratamento;
    @Column(length = 120) private String armacao;

    @Column(length = 1000)
    private String observacoes;

    @PrePersist
    void preencherValoresPadrao() {
        if (dataPedido == null) dataPedido = LocalDateTime.now();
        if (status == null) status = StatusPedido.RECEBIDO;
        if (prioridade == null) prioridade = PrioridadeOrdemServico.NORMAL;
        if (valorTotal == null) valorTotal = BigDecimal.ZERO;
    }

    public void adicionarItem(ItemPedido item) {
        itens.add(item);
        item.setPedido(this);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public List<ItemPedido> getItens() { return itens; }
    public void setItens(List<ItemPedido> itens) { this.itens = itens; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public void setValorTotal(BigDecimal valorTotal) { this.valorTotal = valorTotal; }
    public StatusPedido getStatus() { return status; }
    public void setStatus(StatusPedido status) { this.status = status; }
    public PrioridadeOrdemServico getPrioridade() { return prioridade; }
    public void setPrioridade(PrioridadeOrdemServico prioridade) { this.prioridade = prioridade; }
    public LocalDateTime getDataPedido() { return dataPedido; }
    public void setDataPedido(LocalDateTime dataPedido) { this.dataPedido = dataPedido; }
    public LocalDate getDataPrevisao() { return dataPrevisao; }
    public void setDataPrevisao(LocalDate dataPrevisao) { this.dataPrevisao = dataPrevisao; }
    public BigDecimal getOdEsferico() { return odEsferico; }
    public void setOdEsferico(BigDecimal odEsferico) { this.odEsferico = odEsferico; }
    public BigDecimal getOdCilindrico() { return odCilindrico; }
    public void setOdCilindrico(BigDecimal odCilindrico) { this.odCilindrico = odCilindrico; }
    public Integer getOdEixo() { return odEixo; }
    public void setOdEixo(Integer odEixo) { this.odEixo = odEixo; }
    public BigDecimal getOdAdicao() { return odAdicao; }
    public void setOdAdicao(BigDecimal odAdicao) { this.odAdicao = odAdicao; }
    public BigDecimal getOdDnp() { return odDnp; }
    public void setOdDnp(BigDecimal odDnp) { this.odDnp = odDnp; }
    public BigDecimal getOdAltura() { return odAltura; }
    public void setOdAltura(BigDecimal odAltura) { this.odAltura = odAltura; }
    public BigDecimal getOeEsferico() { return oeEsferico; }
    public void setOeEsferico(BigDecimal oeEsferico) { this.oeEsferico = oeEsferico; }
    public BigDecimal getOeCilindrico() { return oeCilindrico; }
    public void setOeCilindrico(BigDecimal oeCilindrico) { this.oeCilindrico = oeCilindrico; }
    public Integer getOeEixo() { return oeEixo; }
    public void setOeEixo(Integer oeEixo) { this.oeEixo = oeEixo; }
    public BigDecimal getOeAdicao() { return oeAdicao; }
    public void setOeAdicao(BigDecimal oeAdicao) { this.oeAdicao = oeAdicao; }
    public BigDecimal getOeDnp() { return oeDnp; }
    public void setOeDnp(BigDecimal oeDnp) { this.oeDnp = oeDnp; }
    public BigDecimal getOeAltura() { return oeAltura; }
    public void setOeAltura(BigDecimal oeAltura) { this.oeAltura = oeAltura; }
    public String getTipoLente() { return tipoLente; }
    public void setTipoLente(String tipoLente) { this.tipoLente = tipoLente; }
    public String getMaterialLente() { return materialLente; }
    public void setMaterialLente(String materialLente) { this.materialLente = materialLente; }
    public String getTratamento() { return tratamento; }
    public void setTratamento(String tratamento) { this.tratamento = tratamento; }
    public String getArmacao() { return armacao; }
    public void setArmacao(String armacao) { this.armacao = armacao; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
}
