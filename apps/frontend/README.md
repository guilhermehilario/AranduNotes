# Revisa Aula 🚀

Plataforma inteligente para gerenciamento de estudos, criação de resumos e flashcards com repetição espaçada.

---

## 📖 Visão Geral

O **Revisa Aula** é um aplicativo completo para estudantes organizarem cadernos acadêmicos, criar notas de aula (**Folhas / Leaves**), gerar resumos e flashcards com repetição espaçada (algoritmo SM-2), e planejar os estudos com agenda, cronograma, metas e pomodoro.

---

## 🛠️ Stack

### Frontend
| Tecnologia | Versão |
|-----------|--------|
| React | 19 |
| Vite | 8 |
| TypeScript | ~5.7 |
| Tailwind CSS | 4 (OKLCH) |
| Zustand | 5 |
| TanStack React Query | 5 |
| React Router DOM | 7 |
| React Hook Form + Zod | — |
| TipTap | — |
| @dnd-kit | — |
| Lucide React | — |

### Backend (NestJS)
| Tecnologia | Versão |
|-----------|--------|
| NestJS | 11 |
| TypeScript | ~5.7 |
| Prisma ORM | 7 |
| SQLite | — |
| Passport JWT | — |
| class-validator | — |
| @nestjs/config | — |

---

## 📁 Estrutura

```
revisa-aula/
├── src/                           # Frontend React
│   ├── components/                # Componentes reutilizáveis
│   │   ├── layout/                # AppLayout (sidebar + header)
│   │   └── ui/                    # Button, Card, Input, Modal, Skeleton, Toast, etc.
│   ├── core/api/                  # Cliente HTTP (axios + interceptors)
│   ├── modules/                   # Módulos funcionais
│   │   ├── auth/                  # Login, registro, sessão
│   │   ├── notebooks/             # Dashboard + CRUD cadernos (CreateLeafModal, EditNotebookModal)
│   │   ├── leaves/                # Editor TipTap + anotações
│   │   ├── study/                 # Flashcards + SM-2 + estatísticas
│   │   ├── bookmarks/             # Marcadores
│   │   ├── tags/                  # Gerenciamento de tags
│   │   ├── trash/                 # Lixeira (soft-delete)
│   │   ├── profile/               # Perfil + configurações
│   │   ├── todos/                 # Tarefas
│   │   ├── planning/              # Planejamento (agenda, calendário, cronograma, metas, pomodoro)
│   │   ├── questions/             # Questões de estudo
│   │   └── mock-exams/            # Simulados
│   ├── routes/                    # React Router + guards
│   ├── store/                     # Zustand stores (ui, toast, notification, pomodoro, planningSettings, editorStatus)
│   ├── hooks/                     # Hooks globais (useDebounce)
│   ├── App.tsx                    # Componente raiz
│   ├── index.css                  # Tailwind + tema OKLCH
│   └── main.tsx                   # Entry point
├── server/                        # Backend NestJS + Prisma
│   ├── src/
│   │   ├── main.ts                # Bootstrap NestJS
│   │   ├── app.module.ts          # Root module
│   │   ├── app.controller.ts      # Health check
│   │   ├── prisma/                # PrismaService (SQLite)
│   │   ├── common/                # Guards, decorators, filters
│   │   ├── auth/                  # JWT Passport
│   │   ├── notebooks/             # CRUD cadernos
│   │   ├── leaves/                # CRUD folhas + IA mock
│   │   ├── flashcards/            # SM-2 + CRUD
│   │   ├── study/                 # Sessões + estatísticas
│   │   ├── bookmarks/             # Marcadores
│   │   ├── tags/                  # Tags CRUD
│   │   ├── trash/                 # Lixeira + EditHistoryService
│   │   ├── planning/              # Eventos, Metas, Pomodoro (CRUD via API)
│   │   ├── questions/             # Questões
│   │   ├── mock-exams/            # Simulados
│   │   ├── studies/               # Estudos
│   │   └── todos/                 # Tarefas
│   ├── prisma/
│   │   ├── schema.prisma          → Modelos (User, Notebook, Leaf, Flashcard, Event, Goal, PomodoroSession, etc.)
│   │   ├── seed.ts                → Migração db.json → SQLite
│   │   └── migrations/            → Migrações
│   ├── dev.db                     → SQLite
│   └── .env
├── AGENTS.md                      → Documentação técnica
├── ANALISE_PROBLEMAS.md           → Débitos técnicos
├── PADROES.md                     → Guia de padronização de código
├── TESTES_POSSIVEIS.md            → Cenários de teste manual
├── TASKS.md                       → Próximas tarefas
├── start.sh / stop.sh             → Scripts de gerenciamento
└── package.json
```

---

## ⚙️ Funcionalidades

1. **Autenticação** — JWT + refresh token em cookie HttpOnly, registro com avatar Dicebear
2. **Cadernos** — Dashboard em grid, CRUD com cascade, contagem de folhas
3. **Editor TipTap** — Rich text com autosave (debounce 1.5s), anotações coloridas, suporte a sub-folhas
4. **Sub-folhas** — Hierarquia em árvore, reordenação drag & drop (`@dnd-kit`)
5. **IA mockada** — Geração de resumos e flashcards (substituir por API real)
6. **SM-2** — Repetição espaçada com scores 0-5 e CAP de 365 dias
7. **Sessão persistente** — Estado da sessão de estudo salvo no backend
8. **Estatísticas** — Progresso, taxa de acerto, breakdown por caderno
9. **Tags + Bookmarks** — Classificação e favoritos
10. **Lixeira** — Soft-delete com expiração de 15 dias
11. **Modo escuro** — Tema claro/escuro com Tailwind v4
12. **Planejamento** — Agenda, Calendário, Cronograma, Metas e Pomodoro com CRUD completo via API
14. **Notificações** — Notificações nativas (Browser API) e in-app para eventos do dia, metas com prazo e pomodoros concluídos
15. **Mini timer Pomodoro** — Timer flutuante no canto inferior direito visível em todas as páginas
16. **Configurações do Planejamento** — Cores, durações do pomodoro e toggles de notificação
17. **Resumo Semanal** — Cards no Dashboard com eventos, metas e pomodoros da semana
18. **Scripts** — `start.sh` / `stop.sh` para gerenciamento
19. **Código limpo** — Refatoração contínua: código morto removido, componentes extraídos, services unificados

---

## 🚀 Como Executar

```bash
# 1. Backend (NestJS)
cd server
npm install
npm run dev          # http://localhost:3000

# 2. Frontend (Vite)
cd ..
npm install
npm run dev          # http://localhost:5173
```

Ou usar o script unificado:
```bash
./start.sh           # Inicia ambos
./start.sh --status  # Verifica status
./stop.sh            # Para ambos
```

---

## 📋 Scripts

| Comando | Descrição |
|---------|-----------|
| `./start.sh` | Inicia backend + frontend |
| `./stop.sh` | Encerra serviços |
| `npm run dev` (raiz) | Frontend Vite |
| `npm run dev` (server) | Backend NestJS |
| `npm run build` (raiz) | Build frontend |
| `npm test` (server) | Testes backend |

### Portas
| Serviço | Porta |
|---------|-------|
| Backend | 3000 |
| Frontend | 5173 |
| Health | `/api/health` |

---

## 🧪 Testes

```bash
# Backend
cd server && npm test        # Unitários
cd server && npm run test:e2e  # E2E

# Frontend
npm test
```
