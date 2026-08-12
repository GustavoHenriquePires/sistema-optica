# Sistema Óptica

Aplicação web profissional para gestão de ópticas e laboratórios ópticos. O projeto evolui em fases, partindo de um cadastro sólido de clientes até o controle de produtos, estoque, pedidos e produção.

## Situação atual

A V1 está completa. As cinco fases planejadas foram implementadas e os módulos de clientes, produtos, estoque, pedidos e dashboard trabalham de forma integrada.

### Backend

- API REST de clientes com criação, listagem paginada, pesquisa por nome, consulta por ID, edição e exclusão;
- CRUD de produtos com categorias, marca, preço, situação e quantidade em estoque;
- pedidos associados a clientes, formados por um ou mais produtos;
- valor total e subtotais calculados exclusivamente no backend;
- baixa automática de estoque na criação e devolução ao cancelar um pedido;
- fluxo de produção controlado: Recebido, Em produção, Pronto, Entregue e Cancelado;
- indicadores consolidados e pedidos recentes no endpoint do dashboard;
- validação de nome, CPF, telefone e e-mail;
- CPF normalizado e protegido contra duplicidade;
- separação em controller, service, repository, entity e DTOs;
- tratamento global e consistente de erros;
- PostgreSQL configurado por variáveis de ambiente;
- documentação Swagger/OpenAPI;
- testes unitários da camada de serviço e testes de integração da API.

### Frontend

- layout administrativo responsivo com sidebar, header e identificação do usuário;
- dashboard completo com clientes, pedidos, produção, itens prontos, produtos e pedidos recentes;
- tela de clientes com busca, paginação e seleção do tamanho da página;
- cadastro, visualização, edição e exclusão integrados aos endpoints Spring Boot;
- catálogo de produtos com busca, filtros, paginação e CRUD completo;
- estoque com indicadores, pesquisa, alerta de reposição e ajuste rápido de quantidade;
- criação de pedidos com cliente, vários itens, previsão, observações e total em tempo real;
- acompanhamento do pedido com avanço de status, cancelamento e exclusão controlada;
- modo de demonstração publicado, com base fictícia persistida no navegador para testar todo o CRUD sem um backend hospedado;
- validação de formulário no frontend e exibição dos erros devolvidos pela API;
- estados de carregamento, erro, lista vazia, confirmação e feedback de sucesso;
- camada HTTP e tipos TypeScript separados dos componentes.

No ambiente publicado, os módulos funcionam em modo de demonstração e persistem os dados no navegador. Ao informar a URL da API, a mesma interface passa a consumir o backend Spring Boot e o PostgreSQL.

## Tecnologias

### Backend

- Java 21
- Spring Boot 3.5
- Spring Web
- Spring Data JPA e Hibernate
- Bean Validation
- PostgreSQL
- springdoc-openapi / Swagger UI
- Maven
- JUnit 5 e Mockito

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React

## Estrutura principal

```text
sistema-optica/
├── app/                         # rotas Next.js
│   ├── clientes/
│   ├── estoque/
│   ├── pedidos/
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
├── lib/                         # máscaras e formatadores
├── services/                    # camada HTTP
├── types/                       # interfaces correspondentes aos DTOs
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
│   ├── .env.example
│   └── pom.xml
├── .env.example
├── .openai/
└── README.md
```

O frontend permanece na raiz porque esta é a estrutura de execução e hospedagem do projeto Next.js. O backend Java fica isolado em `backend/`.

## Banco de dados PostgreSQL

Crie o banco antes de iniciar a API:

```sql
CREATE DATABASE sistema_optica;
```

Copie `backend/.env.example` para um arquivo local chamado `.env` e ajuste os valores. O Spring Boot lê variáveis do ambiente do processo; ele não carrega o arquivo `.env` automaticamente.

| Variável | Exemplo | Obrigatória |
| --- | --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5432/sistema_optica` | Sim |
| `DB_USERNAME` | `postgres` | Sim |
| `DB_PASSWORD` | senha local do PostgreSQL | Sim |
| `JPA_DDL_AUTO` | `update` | Não |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Não |

No Linux/macOS, por exemplo:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/sistema_optica
export DB_USERNAME=postgres
export DB_PASSWORD=sua_senha
```

No PowerShell:

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/sistema_optica"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="sua_senha"
```

## Executar o backend

Requisitos: JDK 21, Maven 3.9+ e PostgreSQL em execução.

```bash
cd backend
mvn spring-boot:run
```

A API ficará disponível em `http://localhost:8080`.

Para executar os testes e gerar o pacote:

```bash
cd backend
mvn clean verify
```

## Executar o frontend

Requisitos: Node.js 22.13+ e npm.

### Testar sem backend publicado

Quando nenhuma variável de ambiente é informada, o frontend ativa automaticamente o modo de demonstração. Ele oferece clientes, produtos e pedidos fictícios, permitindo testar todos os fluxos da V1. As alterações são armazenadas no navegador e podem ser desfeitas pelo botão **Restaurar dados** de cada módulo.

Esse modo testa a interface completa, mas não substitui a integração Spring Boot/PostgreSQL.

### Conectar ao backend Spring Boot

Copie `.env.example` para `.env.local` e mantenha o modo de demonstração desligado:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_DEMO_MODE=false
```

Instale as dependências e inicie o ambiente de desenvolvimento:

```bash
npm install
npm run dev
```

O frontend ficará disponível em `http://localhost:3000` quando executado pelo Next.js em ambiente local. Mantenha o backend ativo para usar dados reais no PostgreSQL.

Comandos de qualidade:

```bash
npm run lint
npm test
npm run build
```

## Swagger/OpenAPI

Com o backend em execução:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Especificação OpenAPI: `http://localhost:8080/v3/api-docs`

## Endpoints de clientes

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/clientes` | Cadastra um cliente |
| `GET` | `/clientes` | Lista clientes com paginação |
| `GET` | `/clientes?nome=ana` | Pesquisa clientes por nome |
| `GET` | `/clientes/{id}` | Busca um cliente por ID |
| `PUT` | `/clientes/{id}` | Atualiza um cliente |
| `DELETE` | `/clientes/{id}` | Exclui um cliente |

Parâmetros de paginação aceitos pelo `GET /clientes`: `page`, `size` e `sort`. O tamanho máximo permitido por página é 100 registros.

Exemplo de cadastro:

```json
{
  "nome": "Ana Souza",
  "cpf": "529.982.247-25",
  "telefone": "(67) 99999-9999",
  "email": "ana@example.com"
}
```

## Endpoints de produtos e estoque

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/produtos` | Cadastra um produto |
| `GET` | `/produtos` | Lista e filtra produtos |
| `GET` | `/produtos/{id}` | Consulta um produto |
| `PUT` | `/produtos/{id}` | Atualiza todos os dados do produto |
| `PATCH` | `/produtos/{id}/estoque` | Ajusta a quantidade em estoque |
| `DELETE` | `/produtos/{id}` | Exclui um produto |

Filtros disponíveis: `nome`, `categoria`, `ativo`, `page`, `size` e `sort`.

Categorias: `ARMACAO`, `LENTE`, `OCULOS_SOL` e `ACESSORIO`.

## Endpoints de pedidos

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/pedidos` | Cria um pedido e calcula o total |
| `GET` | `/pedidos` | Lista e filtra pedidos |
| `GET` | `/pedidos/{id}` | Consulta o pedido e seus itens |
| `PATCH` | `/pedidos/{id}/status` | Avança ou cancela o pedido |
| `DELETE` | `/pedidos/{id}` | Exclui um pedido cancelado |

Exemplo de criação:

```json
{
  "clienteId": 1,
  "itens": [
    { "produtoId": 3, "quantidade": 2 },
    { "produtoId": 7, "quantidade": 1 }
  ],
  "dataPrevisao": "2026-08-20",
  "observacoes": "Conferir altura de montagem"
}
```

O frontend não envia preços nem total. O backend usa o preço atual do produto, calcula cada subtotal e soma o valor final.

## Dashboard

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/dashboard` | Indicadores consolidados e cinco pedidos recentes |

## Evoluções futuras

1. Autenticação e autorização por perfil.
2. Histórico de movimentações de estoque.
3. Receita óptica e ficha técnica do laboratório.
4. Relatórios, impressão e exportação.
