# Grafia CMS ✍️

**Onde suas palavras ganham forma.**

Grafia é um sistema de gerenciamento de conteúdo (CMS) moderno, construído com **TypeScript**, seguindo princípios de **Domain-Driven Design (DDD)** e **Clean Architecture**. O projeto é organizado como um **monorepo** com npm workspaces, com suporte a instalação via **CLI** e deploy com **PM2**.

---

## 🏗️ Arquitetura

```
grafia-cms/
├── apps/
│   ├── api/              # API REST (Express + Prisma + PostgreSQL)
│   └── web/              # Frontend (Next.js + React + Tailwind CSS)
├── packages/
│   └── shared/           # Tipos e utilitários compartilhados
├── apps/api/prisma/      # Schema + migrações do banco de dados
├── scripts/              # CLI + instaladores
├── server.js             # Servidor principal (produção)
├── ecosystem.config.js   # PM2 para produção
├── public/               # Assets estáticos
├── content/              # Conteúdo do usuário (uploads, themes, plugins)
└── dist/                 # Código compilado para distribuição
```

### Stack

| Camada | Tecnologia |
|--------|-----------|
| **Runtime** | Node.js 18+ |
| **Linguagem** | TypeScript + JavaScript (scripts CLI) |
| **API** | Express 4 |
| **ORM** | Prisma 5 |
| **Banco** | PostgreSQL 15+ (ou MySQL, SQLite para testes) |
| **Frontend** | Next.js 14 + React 18 |
| **Estilos** | Tailwind CSS |
| **Monorepo** | npm workspaces |
| **Segurança** | Helmet, Compression, CORS, express-rate-limit |
| **Processos** | PM2 (cluster mode, auto-restart, logs) |

---

## 📐 Estrutura DDD (API)

```
apps/api/src/
├── domain/          # 🌟 Núcleo do negócio (entidades, value objects, regras)
│   ├── post/        #   Post, PostStatus, IPostRepository
│   └── user/        #   User, UserRole, IUserRepository
├── application/     # 🔧 Casos de uso (orquestração)
│   ├── post/        #   CreatePost, GetPosts, UpdatePost, DeletePost, etc.
│   └── user/        #   CreateUser
├── infrastructure/  # 🛠️ Adaptadores (Prisma, repositórios, DI)
│   ├── repositories/
│   └── database/
├── interfaces/      # 🚪 Controllers, rotas, middlewares
└── server.ts        # 🏁 Ponto de entrada (desenvolvimento)
```

### Princípios de Arquitetura

| Camada | Responsabilidade | Pode importar | Não pode importar |
|--------|-----------------|---------------|-------------------|
| **Domain** | Regras de negócio, entidades, value objects | Tipos nativos TS | Prisma, Express, frameworks |
| **Application** | Orquestração via Use Cases, DTOs | Interfaces do domínio | Prisma, Express diretamente |
| **Infrastructure** | Implementações concretas (Prisma) | Prisma, interfaces do domínio | Controllers, Express |
| **Interfaces** | Controllers, rotas, middlewares | Use cases, Express | Prisma, domínio diretamente |

---

## 🚀 Instalação Rápida (usuário final)

```bash
# 1. Baixe o pacote
wget https://github.com/leandrocorreasantos/grafia-cms/releases/latest/download/grafia-cms.tar.gz
tar -xzf grafia-cms.tar.gz
cd grafia-cms

# 2. Instale as dependências
npm install

# 3. Execute o instalador interativo
npm run install

# 4. Inicie o servidor
npm start
```

> O instalador interativo (`npm run install`) irá guiá-lo configurando banco de dados, usuário admin e chaves de segurança.

---

## 🚀 Setup de Desenvolvimento

### Pré-requisitos

- Node.js >= 18
- Docker e Docker Compose (para o banco PostgreSQL)
- npm >= 9

### Passo a passo

```bash
# 1. Instale as dependências
npm install

# 1.1 Configure variáveis da API
cp apps/api/.env.example apps/api/.env

# 2. Suba o banco de dados PostgreSQL via Docker
docker compose up -d

# 3. Aguarde o banco iniciar
sleep 5

# 4. Gere o Prisma Client
npm run db:generate

# 5. Execute as migrações do banco
npm run db:migrate

# 6. Popule com dados iniciais
npm run db:seed

# 7. Inicie o servidor de desenvolvimento
npm run dev
```

> Para rodar apenas a API (sem o frontend), use `npm run dev:api`.

### Padrao de variaveis de ambiente

- API e Prisma: usar somente apps/api/.env
- Servidor raiz (server.js): usar .env na raiz
- Evite duplicar DATABASE_URL, JWT_SECRET, PORT e NODE_ENV em ambos os arquivos para nao causar conflito no Prisma Studio.

### Acessos

| Serviço | URL |
|---------|-----|
| **Web** (Next.js) | http://localhost:3000 |
| **API** (Express) | http://localhost:3001 |
| **Prisma Studio** | http://localhost:5555 |
| **Adminer** (BD) | http://localhost:8080 |

---

## 📋 Scripts Disponíveis

### Desenvolvimento

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Sobe API + Web em paralelo (hot-reload) |
| `npm run dev:api` | Sobe apenas a API |
| `npm run dev:web` | Sobe apenas o Web |
| `npm run build` | Compila todos os workspaces + build de distribuição |
| `npm run build:dist` | Copia builds para `dist/` na raiz |

### Banco de Dados

| Comando | Descrição |
|---------|-----------|
| `npm run db:generate` | Gera o Prisma Client (a partir de `apps/api/prisma/schema.prisma`) |
| `npm run db:migrate` | Cria migrações de desenvolvimento |
| `npm run db:deploy` | Aplica migrações em produção |
| `npm run db:studio` | Abre o Prisma Studio (GUI do banco) |
| `npm run db:seed` | Popula o banco com dados iniciais |

### Docker

| Comando | Descrição |
|---------|-----------|
| `npm run docker:up` | Sobe os containers Docker (PostgreSQL + Adminer) |
| `npm run docker:down` | Derruba os containers Docker |

### Produção

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia servidor em produção (porta 3000) |
| `npm run start:dev` | Inicia servidor em desenvolvimento |
| `npm run pm2:start` | Inicia com PM2 (cluster mode, auto-restart) |
| `npm run pm2:stop` | Para o processo PM2 |
| `npm run pm2:restart` | Reinicia o processo PM2 |
| `npm run pm2:logs` | Exibe logs do PM2 |

### CLI

| Comando | Descrição |
|---------|-----------|
| `node scripts/cli.js help` | Exibe ajuda da CLI |
| `node scripts/cli.js install` | Instalação interativa |
| `node scripts/cli.js setup` | Setup rápido (migrações + admin) |
| `node scripts/cli.js start` | Inicia servidor |
| `node scripts/cli.js security` | Verifica segurança |

### Segurança

| Comando | Descrição |
|---------|-----------|
| `npm run security` | Verifica configurações de segurança (6 checks) |
| `npm run setup` | Setup rápido pós-clone |
| `npm run setup:db` | Configura banco de dados manualmente |

---

## 🗄️ Modelo de Dados

O schema do banco está centralizado em `apps/api/prisma/schema.prisma`:

```prisma
model Post {
   id          String   @id @default(uuid()) @db.Uuid
  title       String
  slug        String   @unique
  content     String   @db.Text
  excerpt     String   @db.Text
  status      String   @default("draft")   // draft | published | archived
   authorId    String   @db.Uuid
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime?
   author      User           @relation(fields: [authorId], references: [id])
   postCategories PostCategory[]
   postTags       PostTag[]
}

model User {
   id           String   @id @default(uuid()) @db.Uuid
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

## 🔒 Segurança

O servidor de produção (`server.js`) inclui:

| Módulo | Função |
|--------|--------|
| **Helmet** | Headers de segurança HTTP |
| **Compression** | Compressão Gzip |
| **CORS** | Configurável via `.env` |
| **express-rate-limit** | Rate limiting (100 req/15min global, 5 req/15min login) |
| **Logs de auditoria** | Logs de acesso e erro em `logs/` |

Verifique a segurança com:

```bash
npm run security
```

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

## 🧪 Testes

*Setup em andamento — testes serão implementados com Jest + Supertest.*

| Tipo | Escopo | Ferramenta |
|------|--------|-----------|
| **Unitários** | Entidades de domínio, Value Objects, regras de negócio | Jest |
| **Integração** | Endpoints da API, repositórios | Jest + Supertest |
| **Segurança** | Autenticação, injeção, rate limiting | Jest + Supertest |

```bash
# Executar testes (quando implementados)
cd apps/api && npx jest --verbose
```

---

## 📁 Estrutura de Distribuição

Ao fazer o build (`npm run build:dist`), os artefatos compilados são copiados para a raiz:

```
├── dist/                     # Código compilado
│   ├── api/                  # API compilada
│   ├── web/                  # Frontend compilado
│   └── shared/               # Tipos compartilhados
├── prisma/                   # Schema + migrações
├── public/                   # Assets estáticos (fallback)
├── content/                  # Conteúdo do usuário
│   ├── uploads/
│   ├── themes/
│   └── plugins/
├── data/                     # Dados locais (SQLite, etc.)
└── logs/                     # Logs de acesso e erro
```

---

## 🤝 Contribuindo

Toda contribuição é bem-vinda! Para contribuir com o Grafia CMS:

1. **Faça um fork** do projeto para sua conta do GitHub

2. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/grafia-cms.git
   cd grafia-cms
   ```

3. **Crie uma branch** a partir da **`develop`**:
   ```bash
   git checkout -b feature/minha-nova-feature develop
   ```
   > ⚠️ **Importante**: Sempre crie suas branches a partir da `develop`, nunca da `main`.

4. **Desenvolva sua feature** seguindo os princípios do projeto:
   - Respeite a estrutura DDD (Domain-Driven Design)
   - Siga as boas práticas de Clean Code
   - Escreva testes (unitários para domínio, integração para API)
   - Mantenha a consistência do vocabulário ubíquo (Post, User, status, slug, etc.)

5. **Commit** suas mudanças com mensagens claras seguindo [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m 'feat: adiciona funcionalidade X'
   git commit -m 'fix: corrige problema Y'
   git commit -m 'refactor: simplifica lógica de Z'
   ```

6. **Push** para sua branch:
   ```bash
   git push origin feature/minha-nova-feature
   ```

7. **Abra um Pull Request** apontando para a branch **`develop`**:
   - Descreva claramente o que foi alterado
   - Inclua screenshots se houver mudanças visuais
   - Mencione issues relacionadas (se houver)
   - Aguarde a revisão de código

> ✅ **Exemplo de PR**: `feature/adiciona-campo-bio-usuario -> develop`

### Estrutura de Branches

```
main/                     # Código estável em produção
  └── develop/            # Integração de features
       ├── feature/*      # Novas funcionalidades
       ├── fix/*          # Correções de bugs
       └── refactor/*     # Refatorações
```

### Diretrizes de Código

- **TypeScript estrito**: Sempre use tipos explícitos, evite `any`
- **DDD**: Regras de negócio no domínio, orquestração nos use cases
- **Testes**: Domínio deve ter cobertura mínima de 90%, use cases 80%
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/)
- **PRs**: Sempre apontar para `develop` — PRs para `main` serão rejeitados

---

## 📄 Licença

Este projeto está sob a licença MIT.
