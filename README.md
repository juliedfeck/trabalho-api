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

* **Justificativa:** O MVC foi escolhido por ser um padrão amplamente conhecido e didaticamente claro, o que facilita o desenvolvimento em equipe — cada integrante pode trabalhar em uma camada sem interferir nos outros. Para uma API REST de complexidade média como esta, o MVC atende bem sem introduzir abstrações desnecessárias.
* **Trade-off:** Ganha-se organização e clareza de responsabilidades. Abre-se mão de uma camada de serviço separada (Service Layer) — em projetos maiores, os controllers tendem a acumular lógica de negócio que deveria estar isolada. Para o escopo deste trabalho, essa troca é aceitável.

### Banco de Dados — PostgreSQL

Escolhido por ser relacional, atender bem ao modelo de dados com relações entre usuários, tarefas e comentários, e ter suporte nativo no Prisma.

* **Justificativa:** Os dados do sistema têm relações claras e previsíveis — um usuário cria tarefas, tarefas têm comentários, comentários pertencem a usuários. Um banco relacional garante a integridade dessas relações automaticamente, impedindo por exemplo que um comentário exista sem uma tarefa associada.
* **Trade-off:** Ganha-se integridade referencial e consistência dos dados. Abre-se mão da flexibilidade de um banco NoSQL, que seria mais adequado se a estrutura dos dados precisasse mudar com frequência ou se os dados fossem não estruturados.

### ORM — Prisma

Usado como camada de abstração entre o código JavaScript e o banco PostgreSQL. Garante tipagem, validação de queries e controle de migrations.

* **Justificativa:** O Prisma elimina a necessidade de escrever SQL manualmente, reduzindo erros e acelerando o desenvolvimento. As migrations versionadas garantem que todos os integrantes da equipe mantenham o banco sincronizado.
* **Trade-off:** Ganha-se produtividade e segurança contra SQL injection. Abre-se mão de controle total sobre as queries — em situações que exigem otimizações muito específicas, o Prisma pode ser limitante comparado ao SQL puro.

### Autenticação — JWT

Rotas protegidas exigem um token JWT no header `Authorization: Bearer <token>`. O token é gerado no login e contém `id` e `role` do usuário.

* **Justificativa:** JWT é stateless — o servidor não precisa armazenar sessões, o que simplifica a arquitetura. O token carrega o id e o role do usuário, evitando uma consulta ao banco a cada requisição autenticada.
* **Trade-off:** Ganha-se simplicidade e escalabilidade. Abre-se mão da capacidade de invalidar tokens no servidor — o logout é client-side, o que significa que um token roubado permanece válido até expirar. Para o escopo deste trabalho essa troca foi aceita conscientemente e documentada.

### Autorização por Papel (Role-Based Access Control)

O middleware `roleMiddleware.js` restringe certas rotas a papéis específicos. Papéis disponíveis:

| Role | Descrição |
|---|---|
| `user` | Papel padrão. Acesso às tarefas e ao próprio perfil. |
| `admin` | Acesso total: criar e deletar usuários, alterar qualquer perfil. |

* **Justificativa:** O sistema precisa distinguir usuários comuns de administradores — admins podem gerenciar qualquer usuário e tarefa, usuários comuns só acessam os próprios dados. O roleMiddleware centraliza essa verificação em um lugar reutilizável, evitando repetição nos controllers.
* **Trade-off:** Ganha-se controle de acesso simples e extensível. Abre-se mão de permissões granulares — o modelo de dois papéis não cobre cenários como "pode ver tarefas mas não deletar". Para os requisitos do trabalho, dois papéis são suficientes.

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

* **Justificativa:** O `console.log` não é suficiente para produção — não tem timestamp, não separa níveis de severidade e não persiste os registros. O Winston resolve os três problemas e ainda permite configurar múltiplos destinos simultaneamente.
* **Trade-off:** Ganha-se rastreabilidade de erros com contexto (timestamp, nível, mensagem). Abre-se mão de uma solução mais robusta para produção real — os logs em arquivo crescem indefinidamente sem rotação configurada, e em sistemas distribuídos seria necessário um serviço centralizado.

## Requisitos Complementares Implementados

### Complementar 5 — Sistema de Permissões com Papéis (RBAC)
* **Justificativa:** Um sistema colaborativo de tarefas naturalmente precisa de níveis de acesso diferentes — nem todo usuário deveria poder deletar tarefas alheias ou gerenciar outros usuários. O RBAC com dois papéis (`admin` e `user`) resolve esse problema de forma simples e suficiente para o escopo do trabalho, sem adicionar complexidade desnecessária. 
* **Trade-off:** Ganha-se controle de acesso claro e centralizado no `roleMiddleware`, reutilizável em qualquer rota. Abre-se mão de granularidade — o modelo binário não cobre cenários intermediários como um "gerente" que pode atribuir tarefas mas não deletar usuários. Essa limitação foi aceita porque os requisitos do trabalho não exigem mais do que dois papéis.

### Complementar 6 — Comentários em Tarefas (Sub-recursos Aninhados)
* **Justificativa:** Comentários são inerentemente dependentes de tarefas — não faz sentido um comentário existir sem uma tarefa associada. Modelar como sub-recurso aninhado (`/tasks/:taskId/comments`) deixa essa dependência explícita na própria URL, seguindo as boas práticas REST. A escolha reflete diretamente a relação no banco de dados, onde `Comment` tem chave estrangeira obrigatória para `Task`.
* **Trade-off:** Ganha-se uma API semanticamente clara e uma modelagem de dados consistente com a realidade do domínio. Abre-se mão de flexibilidade — se no futuro comentários precisassem ser consultados de forma independente (ex: `GET /comments?userId=1`), a estrutura atual não suporta sem adicionar novas rotas. Para o escopo atual, a troca é válida.

### Complementar 8 — Filtro Avançado de Tarefas
* **Justificativa:** Listar todas as tarefas sem filtro é pouco útil em um sistema colaborativo com múltiplos usuários. Permitir filtrar por `status`, `priority`, `assignedTo`, `dueBefore` e `dueAfter` em uma única rota torna a API muito mais prática, sem multiplicar endpoints. A construção de queries dinâmicas no model centraliza a lógica de filtragem e evita duplicação de código.
* **Trade-off:** Ganha-se flexibilidade para o cliente montar consultas específicas com uma única chamada. Abre-se mão de simplicidade na implementação — queries dinâmicas são mais difíceis de testar do que queries fixas, pois o número de combinações possíveis de filtros é grande. A estratégia adotada foi testar as combinações mais comuns em vez de todas as possíveis.

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
- PostgreSQL rodando localmente (ou via Docker)

### 1. Clonar e instalar dependências

```bash
git clone <url-do-repo>
cd trabalho-api
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
PORT=3000
DATABASE_URL="postgresql://usuario:senha@localhost:5432/taskmanager"
TEST_DATABASE_URL="postgresql://usuario:senha@localhost:5432/taskmanager_test"
JWT_SECRET="sua_chave_secreta_longa"
JWT_EXPIRES_IN="1d"
```

### 3. Criar as tabelas no banco de dados

```bash
npx prisma migrate dev
```

> Isso aplica todas as migrations e cria o schema no banco configurado em `DATABASE_URL`.

### 4. Popular o banco com dados iniciais (obrigatório)

**Este passo é obrigatório.** O seed cria o usuário administrador, sem o qual não é possível autenticar nem utilizar as rotas protegidas.

```bash
npx prisma db seed
```

Após o seed, o seguinte usuário estará disponível:

| Campo | Valor |
|---|---|
| E-mail | `admin@unisinos.br` |
| Senha | `admin123` |
| Role | `admin` |

Use essas credenciais no `POST /auth/login` para obter o token JWT.

### 5. Executar a API

```bash
# desenvolvimento (hot reload)
npm run dev

# produção
npm start
```

A API estará disponível em `http://localhost:3000`.

Documentação Swagger: `http://localhost:3000/api-docs`

### 6. Visualizar os dados com Prisma Studio (opcional)

O Prisma Studio é uma interface visual para inspecionar e editar os dados diretamente no banco.

```bash
npx prisma studio
```

Acesse em `http://localhost:5555`. Você verá as tabelas `User`, `Task` e `Comment` com todos os registros criados pelo seed e pela aplicação.

---

### Banco de testes (para rodar os testes automatizados)

```bash
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
```

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
