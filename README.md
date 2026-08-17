<div align="center">
  <h1>📚 Arandu</h1>
  <p><strong>Plataforma inteligente de anotações e estudos</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Monorepo-Turborepo-red?style=flat-square" alt="Turborepo">
    <img src="https://img.shields.io/badge/Backend-NestJS-E0234E?style=flat-square&logo=nestjs" alt="NestJS">
    <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react" alt="React">
    <img src="https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat-square&logo=prisma" alt="Prisma">
    <img src="https://img.shields.io/badge/Database-SQLite%2FTurso-003B57?style=flat-square&logo=sqlite" alt="Database">
    <img src="https://img.shields.io/badge/Deploy-Fly.io%20%2B%20Render-46E3B7?style=flat-square&logo=render" alt="Deploy">
  </p>
</div>

---

## 📖 Visão Geral

O **Arandu** (que significa "saber" ou "conhecimento" em Tupi Antigo) é uma
plataforma completa para **criação, organização e revisão de conteúdo de estudos**.

Ele permite que estudantes e profissionais criem **cadernos de anotações** com
editor rich text, organizem conteúdo em **folhas** hierárquicas, gerem
**flashcards** e **questões** automaticamente, e acompanhem seu progresso com
técnicas como **Pomodoro** e **revisão espaçada** (algoritmo SM-2).

### Funcionalidades principais

- 📝 **Editor de texto enriquecido** (TipTap) com toolbar multi-linha, pincel de formatação, blocos de código, listas de tarefas e muito mais
- 🗂️ **Cadernos e folhas** hierárquicas com drag & drop
- 🃏 **Flashcards** para revisão espaçada (algoritmo SM-2) — criação manual e por IA
- 📊 **Histórico de revisões** dos flashcards com timeline diária, médias e breakdown por matéria
- ❓ **Questões de estudo** (múltipla escolha, verdadeiro/falso, resposta curta)
- 📋 **Simulados** personalizáveis com limite de tempo
- 📝 **Resumos** automáticos por IA ou criação manual
- 🏷️ **Tags e bookmarks** para organização
- ✅ **Lista de tarefas** integrada (todo-list)
- 📅 **Planejamento** com agenda, calendário, cronograma, metas e Pomodoro
- 📋 **Histórico de cópia e cola** (gestor de clipboard) com busca, favoritos e drag & drop
- 👤 **Avatar personalizável** com múltiplas categorias visuais
- 🎨 **Tema Claro / Escuro / Automático** sincronizado na conta entre dispositivos **(Novo)**
- 🔔 **Notificações e preferências** do sistema
- 🗑️ **Lixeira e arquivamento** com soft-delete
- 🔄 **Histórico de edições**
- 👤 **Autenticação** JWT com refresh tokens, recuperação de senha e aceitação de termos
- ℹ️ **Aba "Sobre" no perfil** com descrição do projeto, roadmap de versões, apoio coletivo (chave PIX em breve) e notas de atualização **(Novo)**
- 📱 **Responsividade mobile completa**: modais com `dvh` + `overscroll-contain`, grids empilhados e menu combinado de notificações + clipboard no header **(Novo)**
- 🧹 **CI com lint obrigatório** (0 warnings) via GitHub Actions no monorepo **(Novo)**

---

## 🏗️ Arquitetura e Tecnologias

```
┌─────────────────────────────────────────────────────────┐
│                    Arandu Monorepo                       │
│           Turborepo + Yarn Workspaces                    │
├─────────────────────┬───────────────────────────────────┤
│   apps/api          │   apps/frontend                   │
│   (NestJS)          │   (React + Vite)                  │
│                     │                                   │
│   ┌─────────────┐   │   ┌─────────────┐                 │
│   │ Controllers │   │   │  React 19   │                 │
│   │  Services   │   │   │  Router DOM │                 │
│   │   Modules   │   │   │  TanStack   │                 │
│   │  PrismaORM  │   │   │  Query      │                 │
│   │   LibSQL    │   │   │  Zustand    │                 │
│   └─────────────┘   │   │  Tailwind   │                 │
│                     │   │  TipTap     │                 │
│                     │   └─────────────┘                 │
└─────────────────────┴───────────────────────────────────┘
```

### Stack principal

| Camada | Tecnologia | Versão |
|---|---|---|
| **Monorepo** | Turborepo + Yarn Workspaces | v2 (Turbo) |
| **Backend** | NestJS + TypeScript | v11 |
| **ORM** | Prisma | v7 |
| **Database** | SQLite (dev) / LibSQL (Turso) | — |
| **Autenticação** | JWT + Passport + bcryptjs | — |
| **Frontend** | React | v19 |
| **Build tool** | Vite | v8 |
| **Estilos** | TailwindCSS | v4 |
| **Editor Rich Text** | TipTap v3 + `@tiptap/pm` | v3 |
| **TypeScript** | Unificado `~5.9.3` em todo o monorepo **(Novo)** | ~5.9.3 |
| **Estado** | Zustand + TanStack Query | v5 |
| **Validação** | Zod v4 + class-validator | — |
| **HTTP Client** | Axios | — |
| **Drag & Drop** | @dnd-kit | v6/core / v10/sortable |
| **Ícones** | Lucide React | v1 |
| **Deploy** | Fly.io (API) + Render (Frontend) | — |

---

## 📁 Estrutura de Pastas

```
arandu-monorepo/
├── apps/
│   ├── api/                          # API NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Schema do banco de dados
│   │   │   ├── migrations/           # Migrations do Prisma
│   │   │   └── seed.ts               # Seed de desenvolvimento
│   │   ├── src/
│   │   │   ├── auth/                 # Autenticação (JWT, registro, login, perfil)
│   │   │   ├── bookmarks/            # Marcadores de páginas
│   │   │   ├── common/               # Guards, decorators, filtros, email
│   │   │   ├── flashcards/           # Flashcards com algoritmo SM-2
│   │   │   ├── leaves/               # Folhas de anotação + IA (resumo, flashcards)
│   │   │   ├── mock-exams/           # Simulados
│   │   │   ├── notebooks/            # Cadernos de estudo
│   │   │   ├── planning/             # Planejamento (eventos, metas, pomodoro)
│   │   │   ├── prisma/               # Prisma service + módulo
│   │   │   ├── questions/            # Questões de estudo
│   │   │   ├── studies/              # Estatísticas de estudo
│   │   │   ├── study/                # Sessões de estudo
│   │   │   ├── tags/                 # Tags para classificação
│   │   │   ├── todos/                # Lista de tarefas
│   │   │   ├── trash/                # Lixeira + histórico de edições
│   │   │   ├── app.controller.ts     # Health check + status
│   │   │   ├── app.module.ts         # Módulo raiz
│   │   │   └── main.ts               # Ponto de entrada
│   │   ├── Dockerfile                # Docker multi-stage para Fly.io
│   │   ├── docker-entrypoint.js      # Entrypoint com Prisma migrate + Litestream
│   │   ├── litestream.yml            # Backup do SQLite para S3/R2
│   │   ├── dbsetup.js                # Setup legacy do banco
│   │   ├── prisma.config.ts          # Config do Prisma v7
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── frontend/                     # SPA React
│       ├── public/
│       │   ├── _redirects            # Fallback SPA (Netlify/Render)
│       │   └── 404.html
│       ├── src/
│       │   ├── components/
│       │   │   ├── core/
│       │   │   │   └── api/          # Axios client + interceptors
│       │   │   ├── layout/           # AppLayout, Sidebar, AppHeader, Breadcrumb
│       │   │   │   ├── sidebar/           # Sidebar com PlanningFlyout
│       │   │   │   └── app-header/       # HeaderTitle, HeaderActions, hooks
│       │   │   └── ui/               # Button, Card, Modal, Input, Toast, Skeleton, etc.
│       │   ├── hooks/                # Hooks globais (useDebounce)
│       │   ├── modules/              # Módulos funcionais
│       │   │   ├── auth/             # Login, registro, recuperação de senha
│       │   │   ├── bookmarks/        # Gerenciamento de favoritos
│       │   │   ├── leaves/           # Editor TipTap + IA (resumo, flashcards)
│       │   │   ├── notebooks/        # Dashboard + CRUD de cadernos
│       │   │   ├── planning/         # Agenda, calendário, cronograma, metas, pomodoro
│       │   │   ├── profile/          # Perfil, avatar, configurações e aba Sobre (AboutTab) **(Novo)**
│       │   │   ├── questions/        # Questões de estudo
│       │   │   ├── mock-exams/       # Simulados
│       │   │   ├── study/            # Flashcards SM-2, revisões, histórico, estatísticas
│       │   │   ├── tags/             # Tags para classificação
│       │   │   ├── todos/            # Lista de tarefas
│       │   │   └── trash/            # Lixeira + arquivados
│       │   ├── routes/               # React Router + guards (PrivateRoute, PublicRoute)
│       │   ├── store/                # Zustand stores (ui, editor, toast, notification, pomodoro, clipboard, planning)
│       │   ├── styles/               # CSS do editor Tiptap, annotations, base, components
│       │   ├── utils/                # api-errors, parse-options
│       │   ├── test/                 # Setup de testes (Vitest + jsdom)
│       │   ├── App.tsx               # Componente raiz
│       │   ├── index.css             # Tailwind + tema (claro/escuro)
│       │   └── main.tsx              # Entry point
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── tsconfig.app.json
│       ├── tsconfig.node.json
│       ├── eslint.config.js
│       └── package.json
├── .github/
│   └── workflows/
│       ├── ci.yml                       # CI com lint obrigatório (turbo run lint) **(Novo)**
│       └── fly-deploy.yml               # CI/CD automático para Fly.io
│
├── package.json                      # Workspaces root + scripts globais
├── turbo.json                        # Configuração do Turborepo
├── render.yaml                       # Blueprint do Render (API + Frontend)
├── fly.toml                          # Configuração do Fly.io
├── CONTRIBUTING.md                   # Guia de contribuição
├── README.md
└── yarn.lock
```

---

## ⚙️ Pré-requisitos

- **Node.js** `>= 20` (recomendado: versão LTS mais recente; Dockerfile usa Node 22)
- **Yarn v1** (Classic) — instalado globalmente:
  ```bash
  npm install -g yarn
  ```
- **Git** para clonar o repositório

---

## 🚀 Como Rodar Localmente

### 1. Clone e instale dependências

```bash
git clone https://github.com/seu-usuario/arandu-monorepo.git
cd arandu-monorepo
yarn install
```

### 2. Configure as variáveis de ambiente

**API** — crie o arquivo `apps/api/.env`:

```env
# Ambiente
NODE_ENV=development

# Banco de dados (SQLite local — padrão)
DATABASE_URL=file:./dev.db

# JWT
JWT_SECRET=minha-chave-secreta-aqui

# Frontend (para CORS em desenvolvimento)
FRONTEND_URL=http://localhost:5173

# Email (opcional — via Nodemailer com Gmail SMTP)
# Use senha de app do Google: https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app
SMTP_FROM=Arandu <seu-email@gmail.com>
```

**Frontend** — crie o arquivo `apps/frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

> 💡 **Dica:** Você pode copiar os exemplos acima. Os arquivos `.env` estão no
> `.gitignore` e **não devem ser commitados**.

### 3. Inicialize o banco de dados

```bash
# Gera o Prisma Client e cria as tabelas no SQLite
yarn workspace api prisma generate
yarn workspace api prisma db push
```

### 4. Inicie o ambiente de desenvolvimento

```bash
# Roda API (porta 3000) e Frontend (porta 5173) simultaneamente
yarn dev
```

A aplicação estará disponível em:
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **API:** [http://localhost:3000/api](http://localhost:3000/api)
- **Health Check:** [http://localhost:3000/health](http://localhost:3000/health)

---

## 🔧 Comandos Úteis

### Globais (raiz do monorepo)

| Comando | Descrição |
|---|---|
| `yarn dev` | Inicia todos os apps em modo dev |
| `yarn build` | Build de todos os apps |
| `yarn lint` | Executa linters em todos os apps |
| `yarn test` | Executa testes em todos os apps |

### Filtrados por workspace (Turbo)

```bash
# Build apenas da API
yarn turbo run build --filter=api

# Build apenas do frontend
yarn turbo run build --filter=frontend

# Testes apenas da API
yarn turbo run test --filter=api
```

### Específicos do workspace (yarn workspace)

```bash
# Prisma (dentro da API)
yarn workspace api prisma generate
yarn workspace api prisma db push
yarn workspace api prisma migrate dev     # Criar nova migration
yarn workspace api prisma migrate deploy  # Aplicar migrations em prod
yarn workspace api prisma studio          # Abrir Prisma Studio

# Testes
yarn workspace api test                 # Testes unitários da API
yarn workspace frontend test            # Testes do frontend (vitest)
yarn workspace api test:e2e             # Testes e2e da API
```

---

## 🌐 Deploy

O deploy é feito em dois ambientes:

### API — Fly.io

A API (NestJS) é deployada no **Fly.io** via GitHub Actions com deploy automático
a cada push na branch `main` (apenas quando há mudanças em `apps/api/**`).

| Recurso | Arquivo | Descrição |
|---------|---------|-----------|
| **CI/CD** | [`.github/workflows/fly-deploy.yml`](./.github/workflows/fly-deploy.yml) | Workflow que executa `flyctl deploy --remote-only` |
| **Docker** | [`apps/api/Dockerfile`](./apps/api/Dockerfile) | Multi-stage build com Node 22 slim + Litestream |
| **Entrypoint** | [`apps/api/docker-entrypoint.js`](./apps/api/docker-entrypoint.js) | Roda `prisma migrate deploy`, inicia Litestream (se `BUCKET_NAME` configurado) e então sobe o servidor |
| **Litestream** | [`apps/api/litestream.yml`](./apps/api/litestream.yml) | Réplica do SQLite para S3/R2 com sync a cada 5min e retenção de 72h |
| **Fly config** | [`fly.toml`](./fly.toml) | App `arandu-api`, região `gru`, volume persistente `/data`, health check `/health` |
| **Secrets** | `flyctl secrets set` | `JWT_SECRET`, `DATABASE_URL`, `SMTP_*`, `BUCKET_NAME`, credenciais S3 |

> ⚠️ **Banco de dados:** Em produção a API usa SQLite armazenado em volume persistente
> do Fly.io, com backup automático via Litestream para bucket S3/R2.
> Alternativamente, pode usar Turso (LibSQL distribuído) configurando `DATABASE_URL`.

### Frontend — Render.com

O frontend (React + Vite) é deployado como **Web Service** no **Render.com**
via Blueprint ([`render.yaml`](./render.yaml)), que define automaticamente os
dois serviços (API + Frontend).

| Recurso | Descrição |
|---------|-----------|
| **Build** | `yarn install && npx turbo run build --filter=frontend` |
| **Publish** | `./apps/frontend/dist` |
| **SPA Fallback** | Rota `/*` redirecionada para `/index.html` |
| **Build Filters** | Só executa quando `apps/frontend/**` ou `package.json` mudam |
| **Env** | `VITE_API_URL=https://arandu-api.fly.dev/api` |

> ⚠️ **Plano Free:** O Render free tier bloqueia portas SMTP (25, 465, 587).
> Para e-mails, use porta alternativa 2525 ou uma API HTTP (nunca bloqueada).

---

## 📄 Licença

---

<div align="center">
  <p>Feito com ☕ e 📚 para facilitar os estudos.</p>
</div>
