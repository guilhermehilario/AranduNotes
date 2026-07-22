# AGENTS.md

## Contexto do projeto

Este repositório é o frontend/backend de um app de estudos chamado **Revisa Aula**.

### Stack Atual

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19 + Vite 8 + TypeScript |
| **Backend** | NestJS 11 + TypeScript |
| **Banco** | SQLite via Prisma ORM 7 (driver adapter LibSQL) |
| **Estado servidor** | TanStack React Query v5 |
| **Estado local/UI** | Zustand 5 (com persistência) |
| **Editor de folhas** | TipTap |
| **Drag & Drop** | @dnd-kit (core + sortable + utilities) |
| **Autenticação** | JWT + Passport + refresh token em cookie HttpOnly |
| **Validação** | class-validator + class-transformer (backend), Zod (frontend) |
| **Config** | @nestjs/config (backend) |

### Estrutura do Backend (NestJS)

```
server/
├── src/
│   ├── main.ts                         → Bootstrap NestJS
│   ├── app.module.ts                   → Root module (ValidationPipe, ExceptionFilter)
│   ├── app.controller.ts               → Health check + status
│   ├── prisma/
│   │   ├── prisma.service.ts           → PrismaClient + LibSQL adapter (SQLite)
│   │   └── prisma.module.ts            → @Global() module
│   ├── common/
│   │   ├── guards/jwt-auth.guard.ts    → Passport JWT Guard
│   │   ├── decorators/current-user.decorator.ts → @CurrentUser()
│   │   └── filters/http-exception.filter.ts     → AllExceptionsFilter
│   ├── auth/
│   │   ├── auth.module.ts              → JWT via ConfigService
│   │   ├── auth.controller.ts          → register, login, logout, refresh, profile
│   │   ├── auth.service.ts             → Lógica de autenticação
│   │   ├── jwt.strategy.ts             → Passport JWT Strategy
│   │   └── dto/                        → RegisterDto, LoginDto
│   ├── notebooks/
│   │   ├── notebooks.module.ts
│   │   ├── notebooks.controller.ts     → CRUD /notebooks
│   │   ├── notebooks.service.ts        → CRUD + cascade delete via Prisma
│   │   └── dto/                        → CreateNotebookDto, UpdateNotebookDto
│   ├── leaves/
│   │   ├── leaves.module.ts
│   │   ├── leaves.controller.ts        → CRUD /notebooks/:nbId/leaves + /leaves/:id
│   │   ├── leaves.service.ts           → CRUD + IA mock (summary, flashcards)
│   │   └── dto/                        → CreateLeafDto, UpdateLeafDto, ReorderLeavesDto
│   ├── flashcards/
│   │   ├── flashcards.module.ts
│   │   ├── flashcards.controller.ts    → GET/PUT flashcards + POST review
│   │   ├── flashcards.service.ts       → SM-2 com CAP 365 dias
│   │   └── dto/                        → ReviewFlashcardDto, UpdateFlashcardDto
│   ├── study/
│   │   ├── study.module.ts
│   │   ├── study.controller.ts         → Sessões + stats
│   │   ├── study.service.ts            → Persistência sessão + getStats
│   │   └── dto/                        → SaveSessionDto
│   └── planning/
│       ├── planning.module.ts          → Modulo de planejamento
│       ├── events.controller.ts        → CRUD /planning/events (agenda + cronograma)
│       ├── events.service.ts
│       ├── goals.controller.ts         → CRUD /planning/goals (metas)
│       ├── goals.service.ts
│       ├── pomodoro.controller.ts      → CRUD /planning/pomodoro
│       ├── pomodoro.service.ts
│       └── dto/                        → Create/Update DTOs para events, goals, pomodoro
├── prisma/
│   ├── schema.prisma                   → Modelos: User, Notebook, Leaf, Flashcard, StudySession, Event, Goal, PomodoroSession, etc.
│   ├── seed.ts                         → Script de migração db.json → SQLite
│   └── migrations/                     → Migrações (init, tags, trash, position, etc.)
├── prisma.config.ts                    → Config Prisma v7
├── dev.db                              → Banco SQLite
└── .env                                → PORT, JWT_SECRET, DATABASE_URL, etc.
```

## Objetivo principal do app

O usuário cria cadernos, folhas de anotação, gera resumos e flashcards por IA e revisa os cards em uma sessão de estudo com repetição espaçada (SM-2). Também conta com um módulo de **Planejamento** completo com agenda, calendário, cronograma, metas e pomodoro.

## Status atual do desenvolvimento

- ✅ Autenticação (register, login, logout, refresh, profile)
- ✅ CRUD de notebooks
- ✅ CRUD de leaves + auto-save no editor TipTap
- ✅ Geração de resumo e flashcards por IA (mockada)
- ✅ Algoritmo SM-2 com CAP de 365 dias
- ✅ Sessão de estudo persistente (backend via API)
- ✅ Estatísticas de progresso (StudyProgressSummary)
- ✅ Refatoração completa para NestJS 11 + Prisma ORM 7 + SQLite
- ✅ Limpeza de arquivos legados do Express (incluindo `_express_backup/`)
- ✅ Remoção de módulos órfãos: EditHistoryController (backend — controller órfão, service mantido) e HistoryService (frontend)
- ✅ Mesclagem de `studiesService` em `studyService`
- ✅ Extração de modais do NotebookView (CreateLeafModal, EditNotebookModal)
- ✅ Correção de loop infinito 429 no auto-save do editor
- ✅ Seção de sub-folhas colapsável no editor
- ✅ Reordenação de sub-folhas por drag & drop (com @dnd-kit)
- ✅ Scripts start.sh e stop.sh para gerenciar backend + frontend
- ✅ Módulo de Planejamento (Agenda, Calendário, Cronograma, Metas, Pomodoro) com CRUD via API
- ✅ Sidebar com sub-menu expansível para Planejamento
- ✅ Sistema de notificações (navegador + in-app) para eventos, metas e pomodoro
- ✅ Mini timer flutuante do pomodoro no canto inferior direito
- ✅ Configurações do planejamento (cores, durações, toggles de notificação)
- ✅ Resumo semanal no Dashboard

## Histórico de alterações

### Sessão 09/07/2026 — Refatoração de código morto, extração de componentes e correção de loop infinito

**O que foi feito:** Três frentes de refatoração: (1) correção de loop infinito 429 no auto-save, (2) remoção de código morto em alta/média/baixa prioridade, (3) extração de componentes do NotebookView.

#### Mudanças realizadas

| Área | Mudança | Detalhes |
|------|---------|----------|
| `useEditorContent.ts` | **Bugfix loop 429** | `editorStatus` (objeto instável da store) estava nas deps de `useCallback`/`useEffect`. Toda `setSaveStatus()` recriava callbacks → cleanup do effect chamava `flushSave()` → PUT → 429 → loop. Corrigido usando `getState()` e removendo `editorStatus` das deps. |
| `server/src/trash/trash.module.ts` | **EditHistoryController removido** | `EditHistoryController` nunca foi importado pelo `app.module.ts` (rota órfã). **`EditHistoryService` mantido** — ainda é usado por `NotebooksService` para registrar histórico de alterações. |
| `server/_express_backup/` | **Legado Express deletado** | 64KB, 9 arquivos do backend Express anterior (pré-NestJS). |
| `src/modules/study/services/` | **studiesService mesclado** | `getContent()` e `getDashboardStats()` adicionados ao `studyService`. `EstudosView` e `ReviewsStudyView` atualizados. `studiesService.ts` preservado em disco (dead). |
| `NotebookView.tsx` | **Modais extraídos** | `CreateLeafModal.tsx` e `EditNotebookModal.tsx` criados. NotebookView reduzido de ~385 para ~210 linhas. |
| `usePlanningNotifications.ts` | **console.warn removido** | 4 ocorrências de `console.warn` substituídas por catch silencioso. |
| `src/modules/history/` | **Módulo órfão deletado** | `historyService.ts` não era importado por nenhum arquivo e chamava APIs já removidas do backend. |
| `CreateLeafModal.tsx` e `EditNotebookModal.tsx` | **Bugfix FieldErrors** | `import { FieldErrors }` causava erro `[MISSING_EXPORT]` no Vite. Corrigido para `import type { FieldErrors }` — types devem ser importados com `import type`. |
| `server/src/trash/trash.module.ts` | **Restauração EditHistoryService** | Após remover o service do módulo, `NotebooksService` quebrou pois dependia dele. Restaurado como provider/export. Apenas o **controller** foi removido (era o verdadeiro código morto). |
| Testes de fluxo | **Bateria completa de testes** | 15 endpoints testados via curl, typecheck frontend/backend, build Vite, todos OK. Exceto `DELETE /api/notebooks/:id` (nunca implementado — soft-delete é via `POST /api/trash/notebooks/:id`). |

#### Lições aprendidas

- **Loop de auto-save (429):** `editorStatus` de uma Zustand store cria nova referência a cada `setSaveStatus()`. Para evitar loops, use `useXxxStore.getState()` em vez de se inscrever no store inteiro, e remova da array de deps.
- **Código morto em módulos:** Módulos NestJS podem conter controllers/services registrados mas nunca importados pelo módulo raiz. Verificar `app.module.ts` antes de assumir que estão ativos.
- **Extração de modais:** Quando um componente tem múltiplos modais inline, extrair cada modal para um arquivo separado reduz o componente principal em ~45% e simplifica a leitura.
- **Temporal Dead Zone em refs:** Ao declarar `useRef(fn)` antes da definição de `const fn = useCallback(...)`, o valor inicial será `undefined`. Solução: inicializar com `useRef<FnType>(null)` e usar optional chaining `ref.current?.()`.
- **Type-only imports:** Tipos de bibliotecas externas (ex: `FieldErrors` do `react-hook-form`) devem ser importados com `import type` em vez de `import` para evitar erros de runtime no Vite.
- **NestJS DI:** Ao remover providers de módulos NestJS, verificar se outros módulos dependem deles. Um service pode ser usado mesmo que seu módulo pareça "morto".

### Sessão 08/07/2026 (Parte 3) — Módulo de Planejamento completo

**O que foi feito:** Implementação do módulo Planejamento com 5 sub-features, sidebar expansível, notificações, mini timer flutuante, configurações e resumo semanal.

#### Mudanças realizadas

| Área | Mudança | Detalhes |
|------|---------|----------|
| **Prisma Schema** | 3 novos modelos | `Event` (agenda/cronograma), `Goal` (metas), `PomodoroSession` |
| **Backend Planning** | Módulo NestJS | EventsController/Service, GoalsController/Service, PomodoroController/Service + DTOs |
| `app.module.ts` | PlanningModule registrado | |
| `Sidebar.tsx` | Sub-menu expansível | Planejamento com 6 sub-itens: Agenda, Calendário, Cronograma, Metas, Pomodoro, Configurações |
| `PlanningView.tsx` | Roteamento por URL | Substituído estado interno de tab por `useParams` |
| `routes/index.tsx` | Rotas /planning/:tab | `/planning` → `/planning/agenda`, `/planning/settings`, `/planning/:tab` |
| `AppHeader.tsx` | Navegação do Planning | PAGE_CONFIG + breadcrumbs + PLANNING_TAB_LABELS |
| `src/modules/planning/` | 5 componentes de aba | AgendaTab, CalendarTab, CronogramaTab, MetasTab, PomodoroTab |
| `src/store/pomodoroStore.ts` | Store global do timer | Timer com intervalo, tick, pause/reset — compartilhado entre páginas |
| `PomodoroFloatingTimer.tsx` | Mini timer flutuante | Bottom-right, visível durante foco/pausa, com pause/stop |
| `src/store/notificationStore.ts` | Store de notificações | Gerenciamento de notificações in-app com deduplicação |
| `usePlanningNotifications.ts` | Hook de notificações | Verifica a cada 1min: eventos do dia, metas com prazo ≤3 dias, pomodoros concluídos. Usa Browser Notification API. Cache-first, API fallback. Respeita settings toggles. |
| `src/store/planningSettingsStore.ts` | Store de configurações | Cor de destaque, durações pomodoro, toggles de notificação (persistida) |
| `PlanningSettingsView.tsx` | Página de configurações | Seletor de cor, controles de duração ±, switches de notificação |
| `PlanningWeeklySummary.tsx` | Resumo semanal | 3 cards no Dashboard: eventos da semana, metas pendentes, estatísticas pomodoro |

#### Lições aprendidas

- **Timer global**: Para persistir o timer entre páginas, extrair o estado e o intervalo para uma Zustand store. O componente de UI lê da store, e o PomodoroTab também.
- **Notificações**: Usar `getState()` da store fora de componentes React para acessar settings em callbacks assíncronos.
- **Cache-first, API-fallback**: Para o hook de notificações, tentar cache do React Query primeiro; se vazio, fazer chamada direta à API. Garante funcionamento em qualquer página.
- **Sub-menu sidebar**: Accordion expansível com `React.useEffect` para auto-expandir ao navegar para sub-rotas. Quando colapsado, mostra apenas o ícone principal.
- **Rotas com parâmetro**: `/planning/settings` deve vir antes de `/planning/:tab` no router para evitar que "settings" seja interpretado como tab.

### Sessão 08/07/2026 (Parte 2) — Refatoração do EditorView em hooks, sistema de toasts e correção de auto-save

**O que foi feito:** Extração da lógica do EditorView (~550 → ~230 linhas), criação de sistema de toasts, correção de bug de auto-save 400, e toasts para todos os catches do projeto.

#### Mudanças realizadas

| Área | Mudança | Detalhes |
|------|---------|----------|
| `src/modules/leaves/hooks/useEditorContent.ts` | **Novo hook** | Editor TipTap, extensões, sync inicial do servidor, auto-save com debounce. ~200 linhas extraídas do EditorView. |
| `src/modules/leaves/hooks/useEditorActions.ts` | **Novo hook** | UI state (sidebar/expansão), archive/delete, geração IA, anotações. ~160 linhas extraídas do EditorView. |
| `src/modules/leaves/views/EditorView.tsx` | **Simplificado** | De ~550 linhas para ~230 linhas. Apenas renderização JSX + integração dos hooks. |
| `src/modules/leaves/hooks/useEditorContent.ts` | **Bugfix 400** | Adicionado guard `if (!debouncedTitle) return` no auto-save para evitar salvar com título vazio (servidor rejeita com @MinLength(1)). |
| `src/store/toastStore.ts` | **Nova store** | Store Zustand para toasts com `addToast(message, type)` e auto-dismiss em 4s. |
| `src/components/ui/Toast.tsx` | **Novo componente** | ToastContainer com animação slide-in, suporte success/error/info, botão de fechar. |
| `src/components/layout/AppLayout.tsx` | **Toast integrado** | ToastContainer adicionado ao layout global. |
| 8 arquivos | **Toasts em catches** | 15 catch blocks no projeto agora exibem toast de erro com a mensagem da API via `extractApiError`. |

#### Lições aprendidas

- **Debounce + sync**: Ao sincronizar dados do servidor com debounce, o valor debounced ainda reflete o estado antigo por N ms. É necessário guard para evitar salvar valores inválidos.
- **Extração de hooks**: Separar lógica de estado em hooks torna o componente mais legível e testável, e reduz linhas em ~60%.
- **Toast com Zustand**: Usar `getState()` para acessar a store fora de componentes React é o padrão correto com Zustand.

### Sessão 08/07/2026 (Parte 1) — Correção de overflow horizontal e scroll lateral no EditorView e TagsManagementView

**O que foi feito:** Correção completa de overflow horizontal em dois componentes principais, eliminação de scroll lateral indevido, e aumento da área de edição.

#### Lições aprendidas (CSS Gotcha)

**Problema:** `overflow-x: hidden` com `overflow-y: visible` (padrão) → navegador converte `overflow-y` para `auto`, criando scrollbar vertical inesperada.
**Solução:** Sempre usar `overflow-hidden` (ambos os eixos) quando quiser cortar overflow em apenas um eixo, a menos que haja motivo explícito para manter o outro eixo em `visible`.
**Regra:** No projeto, prefira `overflow-hidden` a `overflow-x-hidden` isoladamente, para evitar scrollbars fantasmas.

## Rotas da API

### Auth (`/api/auth`)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Registrar novo usuário |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout (limpa cookie) |
| POST | `/auth/refresh` | Renovar access token |
| GET | `/auth/profile` | Perfil do usuário (auth) |

### Notebooks (`/api/notebooks`, auth required)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/notebooks` | Listar cadernos |
| GET | `/notebooks/:id` | Detalhes do caderno |
| POST | `/notebooks` | Criar caderno |
| PUT | `/notebooks/:id` | Atualizar caderno |

> ⚠️ `DELETE /api/notebooks/:id` **não está implementado.** O soft-delete é feito via `POST /api/trash/notebooks/:id`.

### Trash (`/api/trash`, auth required)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/trash` | Listar itens na lixeira |
| POST | `/trash/notebooks/:id` | Mover caderno para lixeira |
| POST | `/trash/leaves/:id` | Mover folha para lixeira |
| POST | `/trash/notebooks/:id/restore` | Restaurar caderno |
| POST | `/trash/leaves/:id/restore` | Restaurar folha |
| DELETE | `/trash/notebooks/:id` | Excluir permanentemente caderno |
| DELETE | `/trash/leaves/:id` | Excluir permanentemente folha |

### Leaves (auth required)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Registrar novo usuário |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout (limpa cookie) |
| POST | `/auth/refresh` | Renovar access token |
| GET | `/auth/profile` | Perfil do usuário (auth) |

### Notebooks (`/api/notebooks`, auth required)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/notebooks` | Listar cadernos |
| GET | `/notebooks/:id` | Detalhes do caderno |
| POST | `/notebooks` | Criar caderno |
| PUT | `/notebooks/:id` | Atualizar caderno |
| DELETE | `/notebooks/:id` | Excluir caderno (cascade) |

### Leaves (auth required)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/notebooks/:id/leaves` | Listar folhas |
| POST | `/notebooks/:id/leaves` | Criar folha |
| GET | `/leaves/:id` | Detalhes da folha |
| PUT | `/leaves/:id` | Atualizar folha |
| DELETE | `/leaves/:id` | Excluir folha |
| POST | `/leaves/:id/summary` | Gerar resumo (IA mock) |
| POST | `/leaves/:id/flashcards` | Gerar flashcards (IA mock) |
| GET | `/leaves/:id/flashcards` | Listar flashcards da folha |
| PATCH | `/leaves/reorder` | Reordenar sub-folhas (recebe `orderedIds: string[]`) |
| POST | `/leaves/:leafId/archive` | Arquivar folha |
| POST | `/leaves/:leafId/unarchive` | Desarquivar folha |
| GET | `/leaves/archived` | Listar folhas arquivadas |

### Flashcards (auth required)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/notebooks/:id/flashcards` | Listar flashcards do caderno |
| PUT | `/flashcards/:id` | Atualizar front/back |
| POST | `/flashcards/:id/review` | Revisar (score 0-5, SM-2) |

### Study (auth required)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/study-sessions/:notebookId` | Carregar sessão |
| PUT | `/study-sessions/:notebookId` | Salvar sessão |
| DELETE | `/study-sessions/:notebookId` | Remover sessão |
| GET | `/study/stats` | Estatísticas de progresso |

### Planning (`/api/planning`, auth required)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/planning/events?type=agenda` | Listar eventos (agenda ou cronograma) |
| GET | `/planning/events/:id` | Detalhes do evento |
| POST | `/planning/events` | Criar evento |
| PUT | `/planning/events/:id` | Atualizar evento |
| DELETE | `/planning/events/:id` | Excluir evento |
| GET | `/planning/goals` | Listar metas |
| POST | `/planning/goals` | Criar meta |
| PUT | `/planning/goals/:id` | Atualizar meta |
| DELETE | `/planning/goals/:id` | Excluir meta |
| GET | `/planning/pomodoro` | Listar sessões pomodoro |
| POST | `/planning/pomodoro` | Criar sessão |
| PUT | `/planning/pomodoro/:id` | Atualizar sessão |
| DELETE | `/planning/pomodoro/:id` | Excluir sessão |

## Regras importantes para futuras alterações

- Não reintroduzir refetches agressivos em rotas de edição sem necessidade
- Evitar invalidar queries inteiras quando o objetivo for apenas atualizar um item específico
- Preservar o estado local do editor sempre que possível (usar refs de controle como `initialSyncDoneRef`)
- Manter as atualizações de cache idempotentes: se o valor já estiver correto, não sobrescrever
- Para estado de sessão de estudo, SEMPRE usar a Zustand Store (`studyStore`) em vez de `useState` local
- Limpar timeouts e timers em `useEffect` de cleanup para evitar memory leaks
- Ao adicionar novos módulos NestJS, importar `AuthModule` para disponibilizar o `JwtAuthGuard`
- Dependências Prisma: o `prisma.config.ts` é necessário para comandos CLI do Prisma v7
- Sub-folhas: `subLeaves` no `EditorView` deve vir de `leaf?.children` (do `useLeaf`), NÃO de `leaves.filter`
- Para reordenação via drag & drop: usar `@dnd-kit` com update otimista nos caches + `onSettled` para rollback
- Altura do EditorView: usar `h-full min-h-0` em vez de `h-[calc(100vh-8rem)]` para respeitar o layout flex do `<main>`
- **CSS Overflow Gotcha:** Prefira `overflow-hidden` a `overflow-x-hidden` isoladamente para evitar scrollbars fantasmas.
- **Timer global:** Para persistir timer entre páginas, extrair estado e intervalo para uma Zustand store. Componentes de UI e o PomodoroTab leem da mesma store.
- **Notificações com settings:** Usar `getState()` da store para acessar configurações em callbacks assíncronos (fora do React).
- **Cache-first, API-fallback:** No hook de notificações, tentar cache do React Query primeiro; se vazio, fazer chamada direta à API.
- **Sub-menu sidebar:** Accordion com `useEffect` para auto-expandir. Rotas com params: rota específica (`/planning/settings`) deve vir antes da genérica (`/planning/:tab`).
- **Zustand + loops:** Evitar colocar objetos de store (`editorStatus`) em deps de hooks. Usar `getState()` para operações pontuais e quebrar o subscription chain.
- **Temporal Dead Zone (TDZ):** `useRef(fn)` antes de `const fn = useCallback(...)` causa valor inicial `undefined`. Inicializar com `useRef<FnType>(null)` + optional chaining `ref.current?.()`.
- **Código morto em módulos:** Sempre verificar `app.module.ts` para confirmar se controllers/services estão de fato registrados antes de assumir que estão ativos.

## Para rodar o projeto

```bash
# Usando os scripts (recomendado)
./start.sh            # Inicia backend + frontend
./start.sh --status   # Ver status dos serviços
./stop.sh             # Para ambos

# Ou manualmente:
# Backend (NestJS)
cd server
npm install
npm run dev           # http://localhost:3000

# Frontend (Vite)
npm install
npm run dev           # http://localhost:5173
```

### Portas
| Serviço | Porta |
|---------|-------|
| Backend (NestJS) | 3000 |
| Frontend (Vite) | 5173 |
| Health check | http://localhost:3000/api/health |

### Logs
- Backend: `server/logs/server.log`
- Frontend: `logs/frontend.log`
- PIDs: `.pids/backend.pid`, `.pids/frontend.pid`
