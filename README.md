<div align="center">
  <h1>📚 Arandu</h1>
  <p><strong>Plataforma inteligente de anotações e estudos</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Monorepo-Turborepo-red?style=flat-square" alt="Turborepo">
    <img src="https://img.shields.io/badge/Backend-NestJS-E0234E?style=flat-square&logo=nestjs" alt="NestJS">
    <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react" alt="React">
    <img src="https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat-square&logo=prisma" alt="Prisma">
    <img src="https://img.shields.io/badge/Database-SQLite%2FTurso-003B57?style=flat-square&logo=sqlite" alt="Database">
    <img src="https://img.shields.io/badge/Deploy-Render-46E3B7?style=flat-square&logo=render" alt="Render">
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

- 📝 **Editor de texto enriquecido** (TipTap) com suporte a anotações e destaque
- 🗂️ **Cadernos e folhas** hierárquicas com drag & drop
- 🃏 **Flashcards** para revisão espaçada (algoritmo SM-2)
- ❓ **Questões de estudo** (múltipla escolha, verdadeiro/falso, resposta curta)
- 📋 **Simulados** personalizáveis com limite de tempo
- 🏷️ **Tags e bookmarks** para organização
- ✅ **Lista de tarefas** (todo-list)
- 📅 **Planejamento** com agenda, cronograma, metas e Pomodoro
- 🗑️ **Lixeira e arquivamento** com soft-delete
- 🔄 **Histórico de edições**
- 👤 **Autenticação** JWT com refresh tokens e recuperação de senha

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
| **Monorepo** | Turborepo + Yarn Workspaces | v1 (Yarn) |
| **Backend** | NestJS + TypeScript | v11 |
| **ORM** | Prisma | v7 |
| **Database** | SQLite (dev) / Turso LibSQL (prod) | — |
| **Autenticação** | JWT + Passport + bcryptjs | — |
| **Frontend** | React | v19 |
| **Build tool** | Vite | v8 |
| **Estilos** | TailwindCSS | v4 |
| **Editor Rich Text** | TipTap | v3 |
| **Estado** | Zustand + TanStack Query | — |
| **Deploy** | Render.com | — |

---

## 📁 Estrutura de Pastas

```
arandu-monorepo/
├── apps/
│   ├── api/                          # API NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Schema do banco de dados
│   │   │   └── migrations/           # Migrations do Prisma
│   │   ├── src/
│   │   │   ├── auth/                 # Autenticação (JWT, registro, login)
│   │   │   ├── bookmarks/            # Marcadores de páginas
│   │   │   ├── common/               # Guards, decorators, filtros
│   │   │   ├── database/             # Serviço de database (JSON fallback)
│   │   │   ├── flashcards/           # Flashcards com algoritmo SM-2
│   │   │   ├── leaves/               # Folhas de anotação
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
│   │   ├── prisma.config.ts          # Config do Prisma v7
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── frontend/                     # SPA React
│       ├── public/
│       │   └── _redirects            # Fallback para SPA no Netlify
│       ├── src/
│       │   ├── components/           # Componentes reutilizáveis
│       │   │   ├── core/
│       │   │   │   └── api/          # Axios client + interceptors
│       │   │   ├── layout/           # AppLayout, Sidebar, Header
│       │   │   └── ui/               # Button, Card, Modal, Toast, etc.
│       │   ├── hooks/                # Hooks globais
│       │   ├── modules/              # Módulos funcionais
│       │   │   ├── auth/             # Login, registro, recuperação
│       │   │   ├── bookmarks/        # Gerenciamento de bookmarks
│       │   │   ├── leaves/           # Editor de folhas + AISidebar
│       │   │   ├── notebooks/        # Dashboard + CRUD de cadernos
│       │   │   ├── planning/         # Agenda, metas, pomodoro
│       │   │   ├── profile/          # Configurações do perfil
│       │   │   ├── study/            # Flashcards, questões, simulados
│       │   │   ├── tags/             # Gerenciamento de tags
│       │   │   ├── todos/            # Lista de tarefas
│       │   │   └── trash/            # Lixeira + arquivados
│       │   ├── routes/               # Configuração do React Router
│       │   ├── store/                # Stores Zustand
│       │   ├── styles/               # CSS global + estilos do editor
│       │   ├── utils/                # Utilitários
│       │   ├── App.tsx               # Componente raiz
│       │   └── main.tsx              # Entry point
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── docs/
│   └── RENDER_DEPLOY.md              # Guia de deploy no Render
│
├── package.json                      # Workspaces root + scripts globais
├── turbo.json                        # Configuração do Turborepo
├── render.yaml                       # Blueprint do Render
└── yarn.lock
```

---

## ⚙️ Pré-requisitos

- **Node.js** `>= 18` (recomendado: versão LTS mais recente)
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

O deploy automatizado é feito via **Render.com** utilizando a funcionalidade
**Blueprint**, que lê o arquivo [`render.yaml`](./render.yaml) na raiz do projeto.

👉 **[Guia completo de deploy →](./docs/RENDER_DEPLOY.md)**

### Resumo do deploy

1. Conecte o repositório ao Render via Blueprint
2. Configure as variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, etc.)
3. O Render cria automaticamente 2 serviços:
   - **`arandu-api`** — Web Service (NestJS)
   - **`arandu-frontend`** — Static Site (React + Vite)
4. Após o deploy, execute as migrations do Prisma

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.

---

<div align="center">
  <p>Feito com ☕ e 📚 para facilitar os estudos.</p>
</div>
