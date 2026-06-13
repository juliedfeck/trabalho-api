# Task Manager API

API RESTful para gerenciamento de tarefas colaborativas, desenvolvida como trabalho acadêmico da disciplina de Engenharia de Software II — UNISINOS.

---

## Visão Geral

O sistema permite que usuários criem, editem, atribuam e concluam tarefas. Toda a comunicação é feita via JSON, com autenticação por JWT.

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

```
User
  id           Int (PK)
  name         String
  email        String (único)
  passwordHash String
  role         String (padrão: "user")
  deletedAt    DateTime? (soft delete)
  createdAt    DateTime
  updatedAt    DateTime

Task
  id           Int (PK)
  title        String
  description  String?
  status       String (padrão: "pending")
  priority     String (padrão: "medium")
  dueDate      DateTime?
  createdAt    DateTime
  updatedAt    DateTime
  createdBy    Int? → User (SET NULL ao deletar usuário)
  assignedTo   Int? → User (SET NULL ao deletar usuário)

Comment
  id           Int (PK)
  text         String
  createdAt    DateTime
  userId       Int → User
  taskId       Int → Task
```

---

## Endpoints

### Autenticação

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login, retorna token JWT | Não |
| POST | `/auth/logout` | Logout (stateless) | Não |

### Usuários

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/users` | Criar usuário | Não |
| GET | `/users/:id` | Buscar usuário por ID | Sim |
| PUT | `/users/:id` | Atualizar usuário | Sim |
| DELETE | `/users/:id` | Soft delete de usuário | Sim |

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

### Comentários

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/tasks/:id/comments` | Criar comentário | Sim |
| GET | `/tasks/:id/comments` | Listar comentários da tarefa | Sim |
| DELETE | `/tasks/:id/comments/:commentId` | Deletar comentário | Sim |

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
- Cada teste é isolado: `beforeAll` cria usuário e token, `afterEach` limpa os dados
- O banco de testes é separado do banco de desenvolvimento

### Cobertura atual

| Módulo | Testes |
|---|---|
| Servidor (rotas base, 404, 500) | 3 testes |
| Tarefas (CRUD completo + filtros + permissões) | 11 testes |

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
    roleMiddleware.js     ← controla acesso por papel
    errorHandler.js       ← tratamento centralizado de erros
    validators/
      userValidator.js
  models/
    User.js
    Task.js
    Comment.js
  routes/
    authRoutes.js
    userRoutes.js
    taskRoutes.js
  utils/
    AppError.js           ← erro operacional customizado
    auth.js               ← hash de senha e geração de JWT
    logger.js             ← Winston
prisma/
  schema.prisma           ← definição do banco
  migrations/             ← histórico de mudanças no banco
tests/
  setup.js                ← troca para banco de testes
  server.test.js
  tasks.test.js
```
