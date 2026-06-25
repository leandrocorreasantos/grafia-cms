# Grafia CMS ✍️

**Onde suas palavras ganham forma.**

Grafia é um sistema de gerenciamento de conteúdo (CMS) moderno, construído com TypeScript, seguindo princípios de **Domain-Driven Design (DDD)** e **Clean Architecture**. O projeto é organizado como um monorepo com npm workspaces.

---

## 🏗️ Arquitetura

```
grafia-cms/
├── apps/
│   ├── api/          # API REST (Express + Prisma + PostgreSQL)
│   └── web/          # Frontend (Next.js + React + Tailwind CSS)
├── packages/
│   └── shared/       # Tipos e utilitários compartilhados
├── docker/           # Configurações Docker
└── scripts/          # Scripts de desenvolvimento
```

### Stack

| Camada | Tecnologia |
|--------|-----------|
| **Runtime** | Node.js |
| **Linguagem** | TypeScript |
| **API** | Express |
| **ORM** | Prisma |
| **Banco** | PostgreSQL 15 |
| **Frontend** | Next.js 14 + React 18 |
| **Estilos** | Tailwind CSS |
| **Monorepo** | npm workspaces |

---

## 📐 Estrutura DDD (API)

```
apps/api/src/
├── domain/          # 🌟 Núcleo do negócio (entidades, value objects, regras)
│   ├── post/        #   Post, PostStatus
│   └── user/        #   User, UserRole
├── application/     # 🔧 Casos de uso (orquestração)
│   ├── post/        #   CreatePost, GetPosts, UpdatePost, DeletePost, etc.
│   └── user/        #   CreateUser
├── infrastructure/  # 🛠️ Adaptadores (Prisma, repositórios, DI)
│   ├── repositories/
│   └── database/
├── interfaces/      # 🚪 Controllers, rotas, middlewares
└── server.ts        # 🏁 Ponto de entrada
```

### Princípios

- **Domain Layer**: Sem dependências externas. Entidades ricas com comportamento de negócio.
- **Application Layer**: Apenas orquestração via Use Cases. DTOs explícitos de entrada/saída.
- **Infrastructure**: Implementações concretas das interfaces definidas no domínio.
- **Interfaces**: Controllers finos, tratamento de erros centralizado, rotas modulares.

---

## 🚀 Setup Rápido

### Pré-requisitos

- Node.js >= 18
- Docker e Docker Compose (para o banco PostgreSQL)
- npm >= 9

### Passo a passo

```bash
# 1. Instale as dependências
npm install

# 2. Suba o banco de dados PostgreSQL via Docker
docker compose up -d

# 3. Aguarde o banco iniciar
sleep 5

# 4. Gere o Prisma Client
npm run db:generate

# 5. Execute as migrações do banco
npm run db:migrate

# 6. (Opcional) Popule com dados iniciais
npm run db:seed

# 7. Inicie o servidor de desenvolvimento
npm run dev
```

> **Nota**: Para rodar apenas a API (sem o frontend), use `npm run dev:api`.

### Acessos

| Serviço | URL |
|---------|-----|
| **Web** (Next.js) | http://localhost:3000 |
| **API** (Express) | http://localhost:3001 |
| **Adminer** (BD) | http://localhost:8080 |

---

## 📋 Scripts Disponíveis

### Raiz do monorepo

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Sobe API + Web em paralelo |
| `npm run dev:api` | Sobe apenas a API |
| `npm run dev:web` | Sobe apenas o Web |
| `npm run build` | Compila todos os workspaces |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Executa migrações do Prisma |
| `npm run db:studio` | Abre o Prisma Studio (GUI do banco) |
| `npm run db:seed` | Popula o banco com dados iniciais |
| `npm run docker:up` | Sobe os containers Docker |
| `npm run docker:down` | Derruba os containers Docker |

### Workspace API (`apps/api`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor com hot-reload |
| `npm run build` | Compila TypeScript |
| `npm run start` | Inicia o servidor compilado |
| `npm run db:seed` | Popula com dados iniciais |

---

## 🗄️ Modelo de Dados

```prisma
model Post {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  content     String   @db.Text
  excerpt     String   @db.Text
  status      String   @default("draft")   // draft | published | archived
  authorId    String
  categoryIds String[]
  tagIds      String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime?
  author      User     @relation(fields: [authorId], references: [id])
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  role         String   @default("author")  // author | admin
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  posts        Post[]
}
```

### Dados iniciais do seed

| Tipo | Dados |
|------|-------|
| **Admin** | email: `admin@grafia.com` / senha: `admin123` |
| **Post** | "Bem-vindo ao Grafia CMS!" (publicado) |

---

## 🧪 Testes

*Setup em andamento — testes serão implementados com Jest + Supertest.*

- **Testes unitários**: Entidades de domínio e casos de uso
- **Testes de integração**: Endpoints da API
- **Testes de segurança**: Autenticação, injeção, rate limiting

---

## 🐳 Docker

O projeto usa Docker apenas para o banco de dados PostgreSQL e Adminer (interface de gerenciamento do banco).

```bash
# Iniciar containers
docker compose up -d

# Parar containers
docker compose down

# Ver logs do banco
docker compose logs -f db
```

### Credenciais do banco

| Campo | Valor |
|-------|-------|
| Host | `localhost` |
| Porta | `5432` |
| Database | `grafia_db` |
| Usuário | `grafia_user` |
| Senha | `grafia_pass` |

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: minha nova feature'`
4. Push: `git push origin minha-feature`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT.
