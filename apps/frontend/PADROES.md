# 📐 Guia de Padronização — Revisa Aula

> **Propósito:** Evitar a criação de novos problemas e garantir consistência no código.
> **Público:** Desenvolvedores mantendo o projeto.
> **Atualizado em:** 09/07/2026

---

## Sumário

1. [Estrutura de Arquivos](#1-estrutura-de-arquivos)
2. [Imports e Exports](#2-imports-e-exports)
3. [Componentes React](#3-componentes-react)
4. [Hooks](#4-hooks)
5. [Zustand Stores](#5-zustand-stores)
6. [NestJS Modules](#6-nestjs-modules)
7. [React Query (TanStack)](#7-react-query)
8. [Tratamento de Erros](#8-tratamento-de-erros)
9. [Tipagem TypeScript](#9-tipagem-typescript)
10. [CSS e Estilos](#10-css-e-estilos)
11. [Anti-padrões Conhecidos](#11-anti-padrões-conhecidos)
12. [Checklist de Code Review](#12-checklist-de-code-review)

---

## 1. Estrutura de Arquivos

### Frontend (`src/`)

```
modules/<nome-do-modulo>/
├── components/        # Componentes específicos do módulo
│   └── NomeComponente.tsx
├── hooks/             # Hooks customizados do módulo
│   └── useNomeHook.ts
├── services/          # Chamadas à API (se necessário separar)
│   └── nomeService.ts
├── views/             # Páginas/views principais
│   └── NomeView.tsx
├── types.ts           # Tipos do módulo
├── constants.ts       # Constantes do módulo (se houver)
└── store.ts           # Store Zustand do módulo (se houver)
```

### Backend (`server/src/`)

```
<nome-do-modulo>/
├── <nome>.module.ts        # @Module() decorator
├── <nome>.controller.ts    # Rotas
├── <nome>.service.ts       # Lógica de negócio
└── dto/
    ├── create-<nome>.dto.ts
    └── update-<nome>.dto.ts
```

### Regras de nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes React | `PascalCase.tsx` | `NotebookView.tsx` |
| Componentes UI reutilizáveis | `PascalCase.tsx` | `Button.tsx` |
| Hooks | `camelCase.ts` prefixo `use` | `useEditorContent.ts` |
| Services (frontend) | `camelCase.ts` | `studyService.ts` |
| Stores (Zustand) | `camelCase.ts` | `toastStore.ts` |
| Types | `camelCase.ts` | `types.ts` |
| Módulos NestJS | `kebab-case` | `notebooks.module.ts` |
| DTOs NestJS | `kebab-case` | `create-notebook.dto.ts` |

---

## 2. Imports e Exports

### Ordem dos imports

```typescript
// 1. React / Next / Bibliotecas externas
import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';

// 2. Tipos de bibliotecas (usando import type)
import type { Editor } from '@tiptap/react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

// 3. Componentes/Layout globais
import { Button } from '../../../components/ui/Button.tsx';

// 4. Hooks e services do projeto
import { useEditorContent } from '../hooks/useEditorContent';

// 5. Tipos locais
import type { Notebook } from '../types';
```

### ⚠️ Regra crítica: type-only imports

**SEMPRE** use `import type` para tipos. **NUNCA** use `import` para tipos.

```typescript
// ✅ CORRETO
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { Notebook, NotebookCreateInput } from '../types';

// ❌ ERRADO - causa erro [MISSING_EXPORT] no Vite
import { FieldErrors } from 'react-hook-form';
```

### Extensão de arquivos nos imports

Use a extensão do arquivo nos imports para clareza:

```typescript
// ✅ CORRETO
import { Button } from '../../../components/ui/Button.tsx';
import { apiClient } from '../../../core/api/client.ts';

// ❌ ERRADO (inconsistente)
import { Button } from '../../../components/ui/Button';
```

### Named exports vs default exports

**PREFIRA** named exports. **EVITE** `export default`.

```typescript
// ✅ CORRETO
export const NotebookView: React.FC = () => { ... };
export function useEditorContent() { ... };
export const studyService = { ... };

// ❌ ERRADO - dificulta refatoração e import consistency
export default function NotebookView() { ... };
```

> **Observação:** O projeto ainda tem ~65 arquivos com `export default`. A migração para named exports deve ser feita gradualmente.

---

## 3. Componentes React

### Estrutura padrão

```typescript
import React from 'react';
// ... outros imports

interface NomeComponenteProps {
  // Props tipadas
  title: string;
  onAction: () => void;
}

export const NomeComponente: React.FC<NomeComponenteProps> = ({
  title,
  onAction,
}) => {
  // Hooks no topo
  const [state, setState] = React.useState(false);

  // Callbacks com useCallback se passados para filhos
  const handleAction = React.useCallback(() => {
    onAction();
  }, [onAction]);

  // Effects
  React.useEffect(() => {
    // cleanup obrigatório se houver timers/subscriptions
    return () => { /* cleanup */ };
  }, []);

  // Renderização
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
};
```

### Limite de tamanho

- **Máximo:** ~250 linhas por componente
- **Acima disso:** Extrair subcomponentes ou hooks
- **Exceção:** Quando tecnicamente justificável (ex: formulários complexos)

### O que NÃO colocar no componente

- ❌ Regras de negócio → Extrair para hooks/services
- ❌ Requisições diretas → Usar React Query hooks
- ❌ Transformação de dados → Extrair para utils/helpers
- ❌ Lógica de formulário → Usar `react-hook-form`

---

## 4. Hooks

### Estrutura padrão

```typescript
import { useState, useCallback, useEffect, useRef } from 'react';
// ... imports

interface UseNomeConfig {
  param1: string;
  param2?: number;
}

export function useNome({ param1, param2 }: UseNomeConfig) {
  // 1. Estado
  const [data, setData] = useState<string | null>(null);

  // 2. Refs (se necessário)
  const dataRef = useRef(data);
  dataRef.current = data;

  // 3. Callbacks
  const handleAction = useCallback(() => {
    doSomething(dataRef.current);
  }, []);

  // 4. Effects
  useEffect(() => {
    // setup
    return () => {
      // cleanup (SEMPRE limpar timers/subscriptions)
    };
  }, []);

  // 5. Retorno
  return { data, handleAction };
}
```

### ⚠️ Regra crítica: Dependências de hooks

**NUNCA** coloque objetos de store Zustand nas dependências de `useCallback`/`useEffect`.

```typescript
// ❌ ERRADO - objeto instável, causa loop infinito
const editorStatus = useEditorStatusStore();
const handleSave = useCallback(() => {
  editorStatus.setSaveStatus('saving');
}, [editorStatus]); // ← cada setSaveStatus() recria editorStatus

// ✅ CORRETO - usa getState() sem se inscrever
const handleSave = useCallback(() => {
  useEditorStatusStore.getState().setSaveStatus('saving');
}, []); // ← sem dependência instável
```

### ⚠️ Regra crítica: Temporal Dead Zone (TDZ)

**NUNCA** passe uma variável declarada com `const` para `useRef` antes de sua declaração.

```typescript
// ❌ ERRADO - flushSave ainda não foi definido (TDZ)
const flushSaveRef = useRef(flushSave);
const flushSave = useCallback(() => { ... });

// ✅ CORRETO - inicializa com null, atualiza depois
const flushSaveRef = useRef<() => void>(null);
// ... depois da definição de flushSave:
flushSaveRef.current = flushSave;
// Uso: flushSaveRef.current?.()
```

### Limpeza de effects

Sempre limpe timers, intervals e subscriptions:

```typescript
useEffect(() => {
  const timer = setTimeout(() => { ... }, 1000);
  return () => clearTimeout(timer); // ✅ cleanup
}, []);

useEffect(() => {
  const interval = setInterval(() => { ... }, 60000);
  return () => clearInterval(interval); // ✅ cleanup
}, []);
```

---

## 5. Zustand Stores

### Estrutura padrão

```typescript
import { create } from 'zustand';

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
```

### ⚠️ Regra crítica: Acessar store fora de componentes

Para acessar a store em callbacks assíncronos ou fora de componentes React, use `getState()`:

```typescript
// ✅ CORRETO
useToastStore.getState().addToast('Erro ao salvar', 'error');

// ✅ CORRETO - para ler estado
const toasts = useToastStore.getState().toasts;
```

Isso é especialmente importante em:
- `catch` blocks em hooks
- Event listeners (beforeunload, visibilitychange)
- Intervalos/setTimeout
- Mutation callbacks do React Query

---

## 6. NestJS Modules

### ⚠️ Regra crítica: Verificar dependências ao remover providers

Antes de remover um provider de um módulo, verifique:
1. Se ele está listado em `providers` e `exports`
2. Se algum **outro módulo** importa este módulo e usa o provider
3. Se o provider é usado por controllers ou services de outros módulos

```typescript
// ✅ CORRETO - EditHistoryService é usado por NotebooksService, então NÃO pode ser removido
@Module({
  controllers: [TrashController],
  providers: [TrashService, EditHistoryService], // ← Mantido
  exports: [TrashService, EditHistoryService],   // ← Exportado para NotebooksModule
})
```

### Ao criar novo módulo

```typescript
@Module({
  imports: [AuthModule],  // ← SEMPRE importar AuthModule para usar JwtAuthGuard
  controllers: [MeuController],
  providers: [MeuService],
  exports: [MeuService],  // ← Exportar se outros módulos dependerem
})
```

---

## 7. React Query (TanStack)

### Preferir atualizações pontuais a invalidar queries inteiras

```typescript
// ✅ CORRETO - update otimista com rollback
const mutation = useMutation({
  mutationFn: (data) => api.update(id, data),
  onMutate: async (data) => {
    await queryClient.cancelQueries({ queryKey: ['notebooks'] });
    const previous = queryClient.getQueryData(['notebooks']);
    queryClient.setQueryData(['notebooks'], (old) =>
      old?.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
    return { previous };
  },
  onError: (_err, _data, context) => {
    queryClient.setQueryData(['notebooks'], context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['notebooks'] });
  },
});
```

### Evitar refetches agressivos

```typescript
// ✅ CORRETO - staleTime razoável
useQuery({
  queryKey: ['notebooks'],
  queryFn: () => api.getNotebooks(),
  staleTime: 1000 * 60 * 5, // 5 minutos
});
```

---

## 8. Tratamento de Erros

### ⚠️ Regra crítica: NUNCA usar console.error/warn sem notificar usuário

```typescript
// ❌ ERRADO - erro silencioso
} catch (err) {
  console.error('Erro ao salvar:', err);
}

// ❌ ERRADO - apenas console.warn
} catch (err) {
  console.warn('[Notificações] Erro ao buscar eventos:', err);
}

// ✅ CORRETO - notifica o usuário via toast
} catch (err) {
  useToastStore.getState().addToast(
    extractApiError(err) || 'Erro ao salvar',
    'error'
  );
}
```

### Usar `extractApiError` para mensagens consistentes

```typescript
import { extractApiError } from '../../../utils/api-errors';

// ✅ CORRETO
const errorMsg = extractApiError(err);
useToastStore.getState().addToast(errorMsg, 'error');
```

---

## 9. Tipagem TypeScript

### Preferir `type` a `interface` para props de componentes

```typescript
// ✅ CORRETO
type NotebookViewProps = {
  notebookId: string;
  onBack: () => void;
};
```

### Usar `interface` para objetos de configuração/state

```typescript
// ✅ CORRETO - interface para objetos que podem ser estendidos
interface Notebook {
  id: string;
  title: string;
  description: string | null;
  color: string;
  leavesCount: number;
}
```

### ⚠️ NUNCA usar `any`

```typescript
// ❌ ERRADO
const data: any = await api.getData();

// ✅ CORRETO - tipar explicitamente
const data = await api.getData() as Notebook[];
// ou melhor:
const data: Notebook[] = await api.getData();
```

---

## 10. CSS e Estilos

### ⚠️ Regra crítica: Overflow

```css
/* ❌ ERRADO - overflow-x: hidden com overflow-y: visible
   O navegador converte overflow-y para auto, criando scrollbar fantasma */
overflow-x: hidden;

/* ✅ CORRETO - usar overflow-hidden em ambos os eixos */
overflow: hidden;

/* OU quando precisar de scroll vertical: */
overflow-y: auto;
overflow-x: hidden;
```

### Altura do EditorView

```typescript
// ✅ CORRETO - respeita o layout flex do <main>
<div className="h-full min-h-0">

// ❌ ERRADO - hardcoded, quebra em diferentes viewports
<div className="h-[calc(100vh-8rem)]">
```

---

## 11. Anti-padrões Conhecidos

### 🔴 Loop de auto-save (429)

**Problema:** Objeto `editorStatus` da store nas deps de hooks → cada `setSaveStatus()` recria callbacks → cleanup chama `flushSave()` → PUT → 429 → `setSaveStatus('error')` → loop.

**Solução:** Usar `getState()` em vez de se inscrever na store.

### 🔴 TDZ em useRef

**Problema:** `useRef(flushSave)` antes de `const flushSave = useCallback(...)`.

**Solução:** `useRef<Fn>(null)` + optional chaining `ref.current?.()`.

### 🔴 Service removido, dependência quebrada

**Problema:** Remover provider do módulo NestJS sem verificar se outros módulos dependem dele.

**Solução:** Verificar `app.module.ts` e os imports de outros services antes de remover.

### 🔴 Import value de tipos

**Problema:** `import { FieldErrors }` onde `FieldErrors` é type-only → erro Vite `[MISSING_EXPORT]`.

**Solução:** Usar `import type { FieldErrors }`.

### 🔴 Overflow-x sem overflow-y

**Problema:** `overflow-x: hidden` com `overflow-y: visible` (padrão) → scrollbar fantasma.

**Solução:** `overflow: hidden` em vez de `overflow-x: hidden`.

---

## 12. Checklist de Code Review

### Antes de commitar/PR, verificar:

- [ ] **TypeScript check** passou (`npx tsc --noEmit`)
- [ ] **Build** passou (`npx vite build`)
- [ ] **Servidor** roda sem erros (`npm run dev` no server)
- [ ] **Nenhum `console.log`/`warn`/`error`** sem toast de usuário
- [ ] **Imports de tipo** usam `import type`
- [ ] **Nenhum `any`** adicionado
- [ ] **Zustand**: `getState()` usado em callbacks, não objeto da store em deps
- [ ] **Effects**: cleanup de timers/intervals
- [ ] **NestJS**: dependências de módulo verificadas (não remover provider usado por outros)
- [ ] **CSS**: `overflow-x: hidden` isolado evitado
- [ ] **Componentes**: abaixo de ~250 linhas
- [ ] **Reutilização**: verificar se existe função/hook/componente duplicado
- [ ] **Rotas**: rota específica antes de rota genérica no router (`/planning/settings` antes de `/planning/:tab`)

---

*Documento gerado em 09/07/2026 — Baseado nas lições aprendidas durante o desenvolvimento e refatoração do Revisa Aula.*
