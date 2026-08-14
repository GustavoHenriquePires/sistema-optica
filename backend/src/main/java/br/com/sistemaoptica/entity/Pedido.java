package br.com.sistemaoptica.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedidos")
public class Pedido {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "cliente_id", nullable = false) private Cliente cliente;
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true) private List<ItemPedido> itens = new ArrayList<>();
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true) private List<LentePedido> lentes = new ArrayList<>();
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true) private List<ServicoPedido> servicos = new ArrayList<>();
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal valorTotal;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private StatusPedido status;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 15) private PrioridadeOrdemServico prioridade;
    @Column(nullable = false, updatable = false) private LocalDateTime dataPedido;
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
    @Column(length = 1000) private String observacoes;

    @PrePersist void preencherValoresPadrao() { if (dataPedido == null) dataPedido = LocalDateTime.now(); if (status == null) status = StatusPedido.RECEBIDO; if (prioridade == null) prioridade = PrioridadeOrdemServico.NORMAL; if (valorTotal == null) valorTotal = BigDecimal.ZERO; }
    public void adicionarItem(ItemPedido item) { itens.add(item); item.setPedido(this); }
    public void adicionarLente(LentePedido lente) { lentes.add(lente); lente.setPedido(this); }
    public void adicionarServico(ServicoPedido servico) { servicos.add(servico); servico.setPedido(this); }
    public Long getId(){return id;} public void setId(Long id){this.id=id;} public Cliente getCliente(){return cliente;} public void setCliente(Cliente cliente){this.cliente=cliente;}
    public List<ItemPedido> getItens(){return itens;} public void setItens(List<ItemPedido> itens){this.itens=itens;} public List<LentePedido> getLentes(){return lentes;} public List<ServicoPedido> getServicos(){return servicos;}
    public BigDecimal getValorTotal(){return valorTotal;} public void setValorTotal(BigDecimal v){valorTotal=v;} public StatusPedido getStatus(){return status;} public void setStatus(StatusPedido v){status=v;} public PrioridadeOrdemServico getPrioridade(){return prioridade;} public void setPrioridade(PrioridadeOrdemServico v){prioridade=v;}
    public LocalDateTime getDataPedido(){return dataPedido;} public void setDataPedido(LocalDateTime v){dataPedido=v;} public LocalDate getDataPrevisao(){return dataPrevisao;} public void setDataPrevisao(LocalDate v){dataPrevisao=v;}
    public BigDecimal getOdEsferico(){return odEsferico;} public void setOdEsferico(BigDecimal v){odEsferico=v;} public BigDecimal getOdCilindrico(){return odCilindrico;} public void setOdCilindrico(BigDecimal v){odCilindrico=v;} public Integer getOdEixo(){return odEixo;} public void setOdEixo(Integer v){odEixo=v;} public BigDecimal getOdAdicao(){return odAdicao;} public void setOdAdicao(BigDecimal v){odAdicao=v;} public BigDecimal getOdDnp(){return odDnp;} public void setOdDnp(BigDecimal v){odDnp=v;} public BigDecimal getOdAltura(){return odAltura;} public void setOdAltura(BigDecimal v){odAltura=v;}
    public BigDecimal getOeEsferico(){return oeEsferico;} public void setOeEsferico(BigDecimal v){oeEsferico=v;} public BigDecimal getOeCilindrico(){return oeCilindrico;} public void setOeCilindrico(BigDecimal v){oeCilindrico=v;} public Integer getOeEixo(){return oeEixo;} public void setOeEixo(Integer v){oeEixo=v;} public BigDecimal getOeAdicao(){return oeAdicao;} public void setOeAdicao(BigDecimal v){oeAdicao=v;} public BigDecimal getOeDnp(){return oeDnp;} public void setOeDnp(BigDecimal v){oeDnp=v;} public BigDecimal getOeAltura(){return oeAltura;} public void setOeAltura(BigDecimal v){oeAltura=v;}
    public String getTipoLente(){return tipoLente;} public void setTipoLente(String v){tipoLente=v;} public String getMaterialLente(){return materialLente;} public void setMaterialLente(String v){materialLente=v;} public String getTratamento(){return tratamento;} public void setTratamento(String v){tratamento=v;} public String getArmacao(){return armacao;} public void setArmacao(String v){armacao=v;} public String getObservacoes(){return observacoes;} public void setObservacoes(String v){observacoes=v;}
}
