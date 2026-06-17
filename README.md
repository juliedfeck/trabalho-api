# Task Manager API

API RESTful para gerenciamento de tarefas colaborativas, desenvolvida como trabalho acadêmico da disciplina de Engenharia de Software II — UNISINOS.

---

## Visão Geral

O sistema permite que usuários criem, editem, atribuam e concluam tarefas. Toda a comunicação é feita via JSON, com autenticação por JWT e controle de acesso por papel (roles).

---

## Decisões Arquiteturais

### Arquitetura MVC

O projeto segue o padrão **MVC (Model-View-Controller)** adaptado para APIs REST:

| Camada | Responsabilidade |
|---|---|
| **Model** (`src/models/`) | Comunica com o banco via Prisma. Nenhuma lógica de negócio. |
| **Controller** (`src/controllers/`) | Recebe a requisição, aplica as regras de negócio e devolve a resposta. |
| **Routes** (`src/routes/`) | Mapeia URLs e métodos HTTP para os controllers. |

A camada View não existe — substituída pelo JSON das respostas.

### Banco de Dados — PostgreSQL

Escolhido por ser relacional, atender bem ao modelo de dados com relações entre usuários, tarefas e comentários, e ter suporte nativo no Prisma.

### ORM — Prisma

Usado como camada de abstração entre o código JavaScript e o banco PostgreSQL. Garante tipagem, validação de queries e controle de migrations.

### Autenticação — JWT

Rotas protegidas exigem um token JWT no header `Authorization: Bearer <token>`. O token é gerado no login e contém `id` e `role` do usuário.

### Autorização por Papel (Role-Based Access Control)

O middleware `roleMiddleware.js` restringe certas rotas a papéis específicos. Papéis disponíveis:

| Role | Descrição |
|---|---|
| `user` | Papel padrão. Acesso às tarefas e ao próprio perfil. |
| `admin` | Acesso total: criar e deletar usuários, alterar qualquer perfil. |

### Rate Limiting — Proteção contra Brute Force

O middleware `loginLimiter.js` limita tentativas de login:
- **5 tentativas** em uma janela de **15 minutos** (em produção)
- Após estourar o limite, retorna `429 Too Many Requests`

### Validação de Dados

Middlewares de validação em `src/middlewares/validators/`:
- `taskValidator.js` — valida `title` obrigatório, e valores aceitos para `status` e `priority`
- `userValidator.js` — valida `name`, `email` e `password` na criação de usuários

### Tratamento de Erros

Centralizado no `errorHandler.js`. Distingue dois tipos:
- **Erros operacionais** (`AppError`) — erros esperados como 404, 401, 403. Retornam a mensagem definida.
- **Erros inesperados** — bugs. Retornam sempre `500` com mensagem genérica, sem expor detalhes internos.

### Logs — Winston

Todos os erros são registrados com timestamp em:
- `logs/error.log` — só erros
- `logs/combined.log` — todos os níveis

---

## Modelagem de Dados

![Diagrama do banco](docs/diagrama-banco.png)

---

## Endpoints

### Autenticação

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login, retorna token JWT. Limitado a 5 tentativas/15 min. | Não |
| POST | `/auth/logout` | Logout (stateless — controle do token fica no cliente) | Não |

### Usuários

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/users` | Criar usuário | Sim (apenas admin) |
| GET | `/users/:id` | Buscar usuário por ID | Sim |
| PUT | `/users/:id` | Atualizar dados do próprio perfil. Admin pode atualizar qualquer usuário e alterar o `role`. | Sim |
| DELETE | `/users/:id` | Soft delete de usuário | Sim (apenas admin) |

> **Soft delete**: o campo `deletedAt` é preenchido com a data, mas o registro permanece no banco.

### Tarefas

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/tasks` | Criar tarefa | Sim |
| GET | `/tasks/:id` | Buscar tarefa por ID | Sim |
| GET | `/tasks` | Listar tarefas com filtros | Sim |
| PUT | `/tasks/:id` | Atualizar tarefa | Sim |
| DELETE | `/tasks/:id` | Deletar tarefa | Sim |

#### Filtros disponíveis em `GET /tasks`

```
GET /tasks?status=pending
GET /tasks?priority=high
GET /tasks?assignedTo=1
GET /tasks?dueBefore=2025-12-31
GET /tasks?status=pending&priority=high&assignedTo=1
```

#### Valores aceitos

| Campo | Valores |
|---|---|
| `status` | `pending`, `in_progress`, `done` |
| `priority` | `low`, `medium`, `high` |

### Comentários

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/tasks/:taskId/comments` | Criar comentário em uma tarefa | Sim |
| GET | `/tasks/:taskId/comments` | Listar comentários da tarefa (do mais antigo ao mais novo) | Sim |
| DELETE | `/tasks/:taskId/comments/:commentId` | Deletar comentário (somente o próprio autor) | Sim |

---

## Configuração e Execução

### Pré-requisitos

- Node.js 18+
- PostgreSQL

### Instalação

```bash
# clone o repositório
git clone <url-do-repo>
cd trabalho-api

# instale as dependências
npm install

# crie o arquivo .env baseado no exemplo
cp .env.example .env
# edite o .env com suas credenciais
```

### Variáveis de ambiente (`.env`)

```env
PORT=3000
DATABASE_URL="postgresql://usuario:senha@localhost:5432/taskmanager"
TEST_DATABASE_URL="postgresql://usuario:senha@localhost:5432/taskmanager_test"
JWT_SECRET="sua_chave_secreta_longa"
JWT_EXPIRES_IN="1d"
```

### Banco de dados

```bash
# cria as tabelas no banco de desenvolvimento
npx prisma migrate dev

# cria as tabelas no banco de testes
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy

# (opcional) popula o banco com dados iniciais
npx prisma db seed
```

### Executar

```bash
# desenvolvimento (hot reload)
npm run dev

# produção
npm start
```

A API estará disponível em `http://localhost:3000`.

Documentação Swagger: `http://localhost:3000/api-docs`

---

## Testes

```bash
# rodar todos os testes
npm test

# rodar com cobertura
npm run test:coverage
```

### Estratégia de testes

- Testes de integração com banco real (`TEST_DATABASE_URL`)
- Testes unitários com mocks (sem banco)
- Cada suite é isolada: `beforeAll` cria usuário e token, `afterAll` limpa os dados
- O banco de testes é separado do banco de desenvolvimento

### Cobertura atual

| Arquivo | Tipo | Testes |
|---|---|---|
| `tests/server.test.js` | Integração | Rotas base, 404, 500 |
| `tests/tasks.test.js` | Integração | CRUD completo + filtros + permissões |
| `tests/users.test.js` | Integração | CRUD de usuários + controle de acesso por role |
| `tests/comment.test.js` | Integração | Criar, listar e deletar comentários |
| `tests/auth.integration.test.js` | Integração | Login, logout, credenciais inválidas, brute force |
| `tests/auth.unit.test.js` | Unitário (mock) | Login, logout, credenciais inválidas, brute force |

---

## Estrutura do Projeto

```
src/
  server.js               ← ponto de entrada
  app.js                  ← configuração do Express
  config/
    prisma.js             ← instância do Prisma
    swagger.js            ← configuração do Swagger
  controllers/
    authController.js
    userController.js
    taskController.js
    commentController.js
  middlewares/
    authMiddleware.js     ← valida JWT
    roleMiddleware.js     ← controla acesso por papel (admin/user)
    loginLimiter.js       ← rate limit no login (brute force)
    errorHandler.js       ← tratamento centralizado de erros
    validators/
      userValidator.js    ← valida dados de criação de usuário
      taskValidator.js    ← valida title, status e priority
  models/
    User.js
    Task.js
    Comment.js
  routes/
    authRoutes.js
    userRoutes.js
    taskRoutes.js         ← inclui as rotas de comentários
  utils/
    AppError.js           ← erro operacional customizado
    auth.js               ← hash de senha e geração de JWT
    logger.js             ← Winston
prisma/
  schema.prisma           ← definição do banco
  seed.js                 ← dados iniciais
  migrations/             ← histórico de mudanças no banco
tests/
  setup.js                ← troca para banco de testes
  server.test.js
  tasks.test.js
  users.test.js
  comment.test.js
  auth.integration.test.js
  auth.unit.test.js
```
