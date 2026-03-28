# Mini SaaS Multi-tenant com Agente de IA

Mini plataforma SaaS fullstack onde empresas gerenciam seus tratamentos e conversam com um agente de IA que responde usando dados reais do banco, respeitando o isolamento por `companyId`. Clientes têm acesso ao catálogo completo de todas as unidades e podem filtrar por empresa.

## Stack

- **Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, OpenAI/Anthropic tool calling, Sharp (imagens)
- **Frontend:** React 18, TypeScript, Vite, React Router
- **Testes:** Vitest, Supertest, mongodb-memory-server, Testing Library
- **Qualidade de código:** ESLint (flat config), Prettier, Husky, lint-staged
- **Infra local:** Docker Compose para MongoDB

## Estrutura

```text
.
├── apps/
│   ├── api/                  # Express API
│   │   └── src/
│   │       ├── controllers/
│   │       ├── middleware/
│   │       ├── models/
│   │       ├── routes/
│   │       ├── services/
│   │       └── utils/
│   └── web/                  # React SPA
│       └── src/
│           ├── components/
│           ├── contexts/
│           ├── hooks/
│           ├── lib/
│           └── pages/
├── .husky/
│   └── pre-commit            # lint-staged no pre-commit
├── .prettierrc
├── eslint.config.js
├── docker-compose.yml
├── LICENSE
└── package.json
```

## Setup em até 5 minutos

### 1. Suba o MongoDB

```bash
docker compose up -d
```

### 2. Instale dependências

```bash
npm install
```

### 3. Configure os ambientes

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Escolha o provedor de IA com `AI_PROVIDER` (`openai` ou `anthropic`) e preencha a chave correspondente (`OPENAI_API_KEY` ou `ANTHROPIC_API_KEY`).

### 4. Baixe as imagens de exemplo

```bash
npm run download-images -w api
```

### 5. Rode o seed

```bash
npm run seed
```

### 6. Suba a aplicação

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Usuários seed

| Email | Senha | Role | Unidade |
|---|---|---|---|
| `admin@rigatti.com.br` | `123456` | admin | Curitiba |
| `admin@rigatti-sp.com.br` | `123456` | admin | São Paulo |
| `cliente@rigatti.com.br` | `123456` | cliente | — (acesso a todas) |

## Roles

| Role | Permissões |
|---|---|
| `admin` | Gerencia produtos da própria empresa, acessa analytics, usa o chat |
| `cliente` | Visualiza catálogo de **todas** as unidades, filtra por empresa, usa o chat |

Admins são vinculados a uma empresa no cadastro (criando ou entrando via slug). Clientes não precisam de empresa — acessam o catálogo completo desde o primeiro login.

## Como funciona o multi-tenant

- O JWT carrega `companyId` e `role`.
- Consultas de produto filtram por `companyId` para admins; clientes recebem todos os produtos com populate da empresa.
- O filtro por unidade no dashboard aceita múltiplas seleções simultâneas via checkboxes.
- A tool do agente consulta apenas produtos da empresa do usuário autenticado.
- O frontend nunca escolhe tenant manualmente; o isolamento nasce da sessão.

## Catálogo de produtos

- Até **6 imagens por produto** com geração automática de thumbnail (900×600 original / 400×267 thumb, WebP).
- Carousel de imagens no card com navegação por botões e dots.
- Upload via `POST /upload/image` (restrito a admins); imagens servidas como arquivos estáticos.
- Busca por nome, descrição e categoria com filtro por especialidade.

## Como o agente de IA responde

1. `POST /chat` recebe a mensagem do usuário autenticado.
2. O backend envia a conversa ao modelo com a tool `search_products`.
3. Quando o modelo chama a tool, o backend consulta o MongoDB filtrando por `companyId`.
4. O resultado volta ao modelo, que monta a resposta final com dados reais.
5. Cada conversa é salva em `ChatLog` com os argumentos extraídos pelo modelo.

Buscas feitas por admins **não** são registradas no mapa de calor — apenas interações de clientes.

## Provedores de IA

| Variável | Descrição | Padrão |
|---|---|---|
| `AI_PROVIDER` | `openai` ou `anthropic` | `openai` |
| `OPENAI_API_KEY` | Chave da OpenAI | — |
| `OPENAI_MODEL` | Modelo OpenAI | `gpt-4.1-mini` |
| `ANTHROPIC_API_KEY` | Chave da Anthropic | — |
| `ANTHROPIC_MODEL` | Modelo Anthropic | `claude-sonnet-4-6` |

## Analytics e mapa de calor

Administradores têm acesso à página **Analytics** (`/analytics`):

- **Termos mais buscados** — palavras-chave extraídas pelo modelo
- **Categorias mais pedidas** — categorias solicitadas nas conversas
- **Faixa de preço** — distribuição de `maxPrice` solicitado
- **Taxa de uso de parâmetros** — `search`, `category`, `minPrice`, `maxPrice`
- **Heatmap de atividade** — grid 7 dias × 24 horas com volume de uso por horário

## Testes

```bash
npm test                   # roda todos os testes (api + web)
npm run test:coverage      # relatório de cobertura
npm test -w api            # só a API
npm test -w web            # só o frontend
```

**102 testes** ao todo:

| Pacote | Tipo | Cobertura |
|---|---|---|
| `api` | Unitários | JWT, HttpError, asyncHandler, requireAuth, requireRole, errorHandler, productSearch |
| `api` | Integração | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, CRUD `/products`, `GET /companies` |
| `web` | Unitários | `apiFetch`, `useTheme`, `ProductCard` (carousel), `AuthContext` (login/logout/restore) |

## Qualidade de código

O projeto usa **ESLint** + **Prettier** com um hook de pre-commit via **Husky** + **lint-staged**. A cada `git commit`, apenas os arquivos staged são formatados e lintados automaticamente.

```bash
npm run lint             # lint de toda a codebase
npm run lint:fix         # lint com auto-fix
npm run format           # formata todos os arquivos
npm run format:check     # verifica formatação sem alterar (útil em CI)
```

Regras aplicadas:

| Escopo | Regras |
|---|---|
| `apps/api/src/**` | TypeScript strict, no unused vars, no-console (warn) |
| `apps/web/src/**` | TypeScript strict, react-hooks/exhaustive-deps, react-refresh |
| `**/__tests__/**` | Regras relaxadas (no-explicit-any e no-console desativados) |

## Scripts úteis

```bash
npm run dev                  # api + web em paralelo
npm run dev:api              # só a api
npm run dev:web              # só o frontend
npm run build                # build de produção
npm run seed                 # popula o banco com dados de exemplo
npm run download-images      # baixa imagens de exemplo para uploads/
npm test                     # roda todos os testes
npm run lint                 # verifica qualidade do código
npm run format               # formata o código
```

## Decisões arquiteturais

- Monorepo com `apps/api` e `apps/web` para facilitar setup e leitura.
- Mongoose para manter schemas claros e regras de domínio próximas do banco.
- Middleware de autenticação e autorização separados para manter segurança reutilizável.
- Serviço de chat isolado do controller para concentrar a lógica de tool calling.
- Suporte a múltiplos provedores de IA por estratégia de função, sem abstração prematura.
- Logs de chat persistidos silenciosamente — falha de log não interrompe a resposta.
- Clientes desacoplados de empresa: `companyId` opcional no modelo `User`, sem quebra de contrato.

## Visão de produção

### Segurança
- Refresh token com rotação automática e revogação por família.
- Rate limiting por tenant e por endpoint, com circuit breaker.
- Proteção contra prompt injection (sanitização + allowlist de intenções).
- Auditoria imutável de ações administrativas.

### Infraestrutura
- Containers stateless com Kubernetes; MongoDB Atlas com replica set.
- CDN para assets do frontend; bucket S3-compatible para imagens de produtos.
- Filas (SQS / BullMQ) para background jobs e ingestão.
- Cache Redis por tenant para catálogos frequentemente acessados.

### Observabilidade
- Logs estruturados em JSON com `traceId` e `companyId`.
- Tracing distribuído (OpenTelemetry) cobrindo HTTP → chat → modelo.
- Métricas por tenant: volume de chats, latência do agente, taxa de tool calls.

### Dados
- Soft delete e política de retenção por tenant.
- LGPD/GDPR: exportação e exclusão de dados a pedido.

## Licença

[Creative Commons Attribution-NonCommercial 4.0 International](LICENSE) — uso livre para fins não comerciais com atribuição.
