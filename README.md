# Sistema de OS — Laboratório Óptico

Aplicação web para gestão de ordens de serviço de laboratório óptico. O sistema centraliza clientes, OS, receita óptica, especificações técnicas, produção, produtos, estoque e indicadores operacionais.

## Situação atual

A aplicação já possui uma primeira versão funcional do fluxo de **Ordens de Serviço**. A antiga área de pedidos foi evoluída para o contexto de laboratório óptico, mantendo compatibilidade com produtos e estoque quando uma OS possuir itens vinculados.

### Ordens de serviço

- registro de nova OS em uma subaba dedicada;
- número visual de OS no formato `OS-000001`;
- cliente e previsão de entrega;
- prioridade `NORMAL` ou `URGENTE`;
- receita separada por OD e OE;
- esférico, cilíndrico, eixo, adição, DNP e altura;
- tipo de lente;
- material / índice;
- tratamento;
- armação;
- observações técnicas;
- acompanhamento por status: Recebido, Em produção, Pronto, Entregue e Cancelado;
- visualização detalhada da receita dentro da própria OS;
- OS técnica pode existir sem produto vinculado no backend;
- quando houver produto vinculado, o estoque continua sendo validado e atualizado.

### Backend

- Java 21 e Spring Boot 3.5;
- API REST;
- Spring Data JPA e Hibernate;
- PostgreSQL;
- Bean Validation;
- Swagger / OpenAPI;
- separação em controller, service, repository, entity e DTOs;
- tratamento global de erros;
- testes unitários e de integração;
- clientes com CRUD, busca e paginação;
- produtos e estoque integrados;
- OS associadas a clientes;
- baixa automática de estoque para itens vinculados e devolução ao cancelar;
- indicadores consolidados no dashboard.

### Frontend

- Next.js 16, React 19 e TypeScript;
- Tailwind CSS 4;
- layout administrativo responsivo;
- identidade **Sistema de OS — Laboratório Óptico**;
- dashboard;
- clientes;
- ordens de serviço;
- subaba **Registrar nova OS**;
- produtos;
- estoque;
- busca e filtros de OS;
- indicação de prioridade;
- modal de detalhe com receita óptica;
- estados de carregamento, erro, vazio e feedback de sucesso;
- modo de demonstração para uso sem backend publicado.

## Estrutura principal

```text
sistema-optica/
├── app/
│   ├── clientes/
│   ├── estoque/
│   ├── pedidos/
│   │   ├── nova-os/
│   │   └── page.tsx
│   ├── produtos/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── clientes/
│   ├── dashboard/
│   ├── estoque/
│   ├── layout/
│   ├── pedidos/
│   ├── produtos/
│   └── ui/
├── services/
├── types/
├── backend/
│   ├── src/main/java/br/com/sistemaoptica/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── exception/
│   │   ├── repository/
│   │   └── service/
│   ├── src/main/resources/
│   ├── src/test/
│   └── pom.xml
├── .github/workflows/ci.yml
└── README.md
```

O endpoint legado `/pedidos` foi mantido por compatibilidade interna, mas representa **Ordens de Serviço** na interface e na documentação da API.

## Banco de dados PostgreSQL

Crie o banco antes de iniciar a API:

```sql
CREATE DATABASE sistema_optica;
```

Variáveis principais:

| Variável | Exemplo | Obrigatória |
| --- | --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5432/sistema_optica` | Sim |
| `DB_USERNAME` | `postgres` | Sim |
| `DB_PASSWORD` | senha local | Sim |
| `JPA_DDL_AUTO` | `update` | Não |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Não |

## Executar o backend

Requisitos: JDK 21, Maven 3.9+ e PostgreSQL.

```bash
cd backend
mvn spring-boot:run
```

API: `http://localhost:8080`

Testes:

```bash
cd backend
mvn clean verify
```

## Executar o frontend

Requisitos: Node.js 22.13+ e npm.

```bash
npm install
npm run dev
```

Para usar o backend real:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_DEMO_MODE=false
```

Qualidade:

```bash
npm run lint
npm run build
```

## Swagger / OpenAPI

Com o backend ativo:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI: `http://localhost:8080/v3/api-docs`

## Endpoints de ordens de serviço

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/pedidos` | Registra uma nova OS |
| `GET` | `/pedidos` | Lista e filtra OS |
| `GET` | `/pedidos/{id}` | Consulta uma OS |
| `PATCH` | `/pedidos/{id}/status` | Atualiza o status |
| `DELETE` | `/pedidos/{id}` | Exclui uma OS cancelada |

Exemplo de OS técnica:

```json
{
  "clienteId": 1,
  "itens": [],
  "dataPrevisao": "2026-08-20",
  "prioridade": "URGENTE",
  "odEsferico": -1.25,
  "odCilindrico": -0.50,
  "odEixo": 90,
  "odDnp": 31.5,
  "odAltura": 22,
  "oeEsferico": -1.00,
  "oeCilindrico": -0.75,
  "oeEixo": 80,
  "oeDnp": 31,
  "oeAltura": 22,
  "tipoLente": "Progressiva",
  "materialLente": "1.60",
  "tratamento": "Antirreflexo",
  "armacao": "Aro fechado",
  "observacoes": "Conferir altura antes da montagem"
}
```

## Integração contínua

O GitHub Actions executa automaticamente:

- lint e build do frontend;
- `mvn clean verify` no backend.

## Próximas evoluções

1. Histórico de movimentações e alterações de cada OS.
2. Etapas laboratoriais mais detalhadas, como conferência, surfaçagem, tratamento, montagem e controle de qualidade.
3. Impressão da ficha / OS.
4. Relatórios e exportação.
5. Autenticação e autorização por perfil.
6. Desacoplamento completo entre catálogo/estoque e OS técnica no modo de demonstração.
