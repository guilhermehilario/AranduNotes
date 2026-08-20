# PROMPT 2 — CORREÇÕES ALTO + MÉDIO

**Objetivo:** Corrigir as 10 vulnerabilidades ALTO e 14 vulnerabilidades MÉDIO, construindo sobre a infraestrutura preparada pelo PROMPT 1.

**Pré-requisito:** PROMPT 1 concluído com sucesso. Verificar que os CRÍTICOS foram corrigidos antes de iniciar.

**Branch de trabalho:** `development` (SQLite local), com cherry-pick para `main` e `homologacao` ao final.

---

## 1. CONTEXTO

### 1.1 O que o PROMPT 1 preparou

- Utility de hashing SHA-256 para tokens (se criada)
- Configuração de ThrottlerModule (verificada/ajustada)
- Jest configurado e funcional
- Schema Prisma possivelmente alterado (tokens hasheados)

### 1.2 Regras Fundamentais (mantidas)

1. NÃO assumir vulnerabilidade sem confirmação no código real
2. Investigar antes de corrigir
3. Preservar funcionalidades existentes
4. Não inventar arquivos, endpoints ou resultados de teste
5. Ownership: apenas proprietário acessa seu conteúdo

### 1.3 Regra Especial: Auth como sistema único

Múltiplos achados estão no sistema de autenticação. O agente deve analisar o sistema como um fluxo único:

```
register → login → access token → refresh token → rotation →
logout → logout all → forgot password → reset password →
verify email → change password → delete account →
session management → CSRF → cookies → JWT → rate limiting
```

Não implementar correções isoladas que criem inconsistências. Avaliar impacto de cada mudança nos outros fluxos.

### 1.4 Regra Especial: Frontend

Validar: XSS, open redirect, armazenamento local, cookies, CSRF, CSP, navegação, HTML content, URLs externas, logs sensíveis. NÃO confiar apenas em validação frontend — toda autorização continua no backend.

---

## 2. VULNERABILIDADES ALTO

### ALTO-6: Limite máximo de senha (DoS via bcrypt)

**Investigar:**
```
apps/api/src/auth/dto/register.dto.ts
apps/api/src/auth/dto/login.dto.ts
apps/api/src/auth/dto/change-password.dto.ts
apps/api/src/auth/auth.utils.ts
```

**Correção:** Adicionar `@MaxLength(128)` em todos os DTOs que aceitam senha. Adicionar validação em `validatePassword()`.

**Testes:**
- [ ] Senha > 128 caracteres é rejeitada com 400
- [ ] Senha de 8-128 caracteres é aceita
- [ ] Teste em register, login e change-password

---

### ALTO-7: Endpoint debug/connections expõe infraestrutura

**Investigar:**
```
apps/api/src/app.controller.ts
apps/api/src/auth/guards/
```

**Correção:** Verificar se é necessário para o projeto. Opções:
1. Adicionar guard admin-only (verificar se existe role no User model)
2. Remover em produção (verificar se `NODE_ENV === 'production'` bloqueia)
3. Simplificar response para expor apenas o necessário

**Testes:**
- [ ] Usuário comum → 403 ou response sanitizado
- [ ] Response não contém: driver type, SMTP config, memory details

---

### ALTO-8: Dockerfile copia monorepo inteiro

**Investigar:**
```
apps/api/Dockerfile
.dockerignore
```

**Correção:**
- Expandir `.dockerignore` para excluir: `.github/`, `docs/`, `*.md`, `apps/frontend/`, `apps/dashboard/`, `render.yaml`, `fly.toml`, `.turbo/`
- Se `COPY . .` for problemático, copiar apenas arquivos necessários

**Testes:**
- [ ] Docker build funciona sem erros
- [ ] Imagem final não contém arquivos excluídos

---

### ALTO-9: Secrets JWT hardcoded como fallback

**Investigar:**
```
apps/api/src/main.ts
apps/api/src/auth/auth.module.ts
apps/api/src/auth/jwt.strategy.ts
apps/api/src/auth/auth-core.service.ts
```

**Correção:** Remover fallbacks `'dev-jwt-secret'` e `'dev-refresh-secret'` de todos os arquivos exceto `main.ts` (que já valida). Se secrets não definidos → erro na inicialização.

**Testes:**
- [ ] Sem JWT_SECRET definido → app recusa iniciar
- [ ] Com JWT_SECRET definido → app inicia normalmente
- [ ] Teste em auth.module.ts e jwt.strategy.ts

---

### ALTO-10: .gitignore incompleto para .env.*

**Investigar:**
```
.gitignore
```

**Correção:** Adicionar padrões `.env.*` (exceto `.env.example`).

**Testes:**
- [ ] Criar `.env.test` → `git status` não mostra
- [ ] `.env.example` continua visível

---

### ALTO-11: HTML não sanitizado no editor Tiptap

**Investigar:**
```
apps/frontend/src/modules/leaves/hooks/useEditorContent.ts
apps/frontend/src/modules/leaves/hooks/editorExtensions.ts
apps/frontend/package.json
```

**Correção:**
- Instalar DOMPurify (`yarn workspace frontend add dompurify @types/dompurify`)
- Sanitizar HTML antes de `editor.commands.setContent()`
- Validar scheme de URLs no handler de Ctrl+Click (apenas http/https)

**Testes:**
- [ ] Conteúdo com `<script>` é sanitizado
- [ ] Link `javascript:` não é clicável
- [ ] Link `https://` funciona normalmente
- [ ] Conteúdo legítimo (markdown, imagens) preservado

---

### ALTO-12: DTOs ausentes em endpoints de auth

**Investigar:**
```
apps/api/src/auth/auth.controller.ts
apps/api/src/auth/dto/
```

**Correção:** Criar DTOs com class-validator para: `forgotPassword`, `resetPassword`, `verifyEmail`, `resendVerification`, `changePassword`, `confirmDeletion`.

**Testes:**
- [ ] Email inválido em forgotPassword → 400
- [ ] Token inválido em resetPassword → 400
- [ ] Password < 8 chars em changePassword → 400

---

### ALTO-13: Enumeração de usuários via logs

**Investigar:**
```
apps/api/src/auth/auth-core.service.ts
```

**Correção:** Unificar mensagem de log para "Falha de autenticação" sem diferenciar "usuário não encontrado" de "senha inválida".

**Testes:**
- [ ] Login com email inexistente → mesma mensagem que login com senha errada

---

### ALTO-14: EditHistory armazena diffs completos

**Investigar:**
```
apps/api/prisma/schema.prisma
apps/api/src/trash/edit-history.service.ts
```

**Correção:**
- Implementar política de retenção: deletar registros com > 6 meses
- Adicionar cleanup periódico ou on-demand
- Considerar limitar tamanho de `oldValue`/`newValue`

**Testes:**
- [ ] Registros > 6 meses são removidos
- [ ] Registros < 6 meses são preservados

---

### ALTO-15: DATABASE_URL loggada com redação incompleta

**Investigar:**
```
apps/api/src/main.ts
```

**Correção:** Redator parte de userinfo da URL: `://user:pass@host` → `://***:***@host`.

**Testes:**
- [ ] Log de startup não contém senha do banco

---

## 3. VULNERABILIDADES MÉDIO

### MÉDIO-16: TTL access token 24h → 15-30min

**Investigar:** `apps/api/src/auth/auth.module.ts`

**Correção:** Reduzir `expiresIn: '24h'` para `'15m'` ou `'30m'`. Verificar que o refresh flow continua funcionando.

**Testes:**
- [ ] Access token expira em 15min/30min
- [ ] Refresh token continua renovando normalmente

---

### MÉDIO-17: Lockout de conta após tentativas falhas

**Investigar:** `apps/api/src/auth/auth-core.service.ts`

**Correção:** Implementar tracking de tentativas falhas no User model. Após 5 tentativas: lockout progressivo (1min → 5min → 15min).

**Schema change necessário:** Adicionar campos `failedLoginAttempts` e `lockedUntil` ao User model.

**Testes:**
- [ ] 5 tentativas falhas → conta bloqueada temporariamente
- [ ] Após expiração do lockout → login funciona novamente
- [ ] Login bem-sucedido reseta contador

---

### MÉDIO-18: SameSite=None e CSRF

**Investigar:** `apps/api/src/auth/auth.controller.ts`

**Análise:** `SameSite=None` é necessário para cross-origin (frontend em domínio diferente). Verificar se CORS restritivo mitiga suficientemente.

**Correção:** Documentar como risco aceito OU adicionar CSRF token para endpoints state-changing.

---

### MÉDIO-19: Logout de todos os dispositivos

**Investigar:** `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth-core.service.ts`

**Correção:** Criar endpoint `POST /auth/logout-all` que revoga todos os refresh tokens do usuário.

**Testes:**
- [ ] Logout-all revoga todos os tokens
- [ ] Dispositivo B perde acesso após dispositivo A fazer logout-all
- [ ] Endpoint exige autenticação

---

### MÉDIO-20: Campo name sem @MaxLength

**Investigar:** `apps/api/src/auth/dto/register.dto.ts`, `apps/api/src/auth/profile.service.ts`

**Correção:** Adicionar `@MaxLength(100)` ao campo name.

**Testes:**
- [ ] Nome > 100 caracteres → 400

---

### MÉDIO-21 e MÉDIO-22: CSP (frontend + backend)

**Investigar:**
```
apps/frontend/index.html
apps/frontend/vite.config.ts
apps/api/src/main.ts
```

**Correção:**
- Frontend: adicionar CSP via `vite.config.ts` server.headers
- Avaliar se `'unsafe-inline'` para styles é aceitável
- Conectar CSP `connect-src` com `VITE_API_URL`

**Testes:**
- [ ] Frontend carrega sem erros de CSP
- [ ] Requisições API não são bloqueadas

---

### MÉDIO-23: Console.log de auth em produção

**Investigar:**
```
apps/frontend/src/modules/auth/store.ts
apps/frontend/src/core/api/client.ts
apps/frontend/src/main.tsx
```

**Correção:** Gate todos os console.log/warn/error atrás de `import.meta.env.DEV`.

**Testes:**
- [ ] Build de produção não contém console.log de auth

---

### MÉDIO-24: CSRF token

**Análise:** O sistema usa `Authorization: Bearer` header + cookies. Browsers não enviam `Authorization` header em requests cross-origin por default. O refresh endpoint usa apenas cookies.

**Decisão:** Implementar CSRF token APENAS para o endpoint `/auth/refresh` (o único state-changing que depende só de cookie).

---

### MÉDIO-25: Open redirect via React Router

**Investigar:**
```
apps/frontend/src/routes/PublicRoute.tsx
```

**Correção:** Validar que `from.pathname` começa com `/` e não com `//`.

**Testes:**
- [ ] Redirect para `//evil.com` → redireciona para `/dashboard`
- [ ] Redirect para `/notebooks` → funciona normalmente

---

### MÉDIO-26: Schema divergence SQLite/PostgreSQL

**Análise:** Branch `development` usa SQLite, `main` usa PostgreSQL. Isso é intencional.

**Correção:** Documentar explicitamente as diferenças conhecidas. NÃO unificar schema (manter o design atual).

---

### MÉDIO-27: Docker entrypoint shell:true

**Investigar:** `apps/api/docker-entrypoint.js`

**Correção:** Usar `execFile` com array de argumentos em vez de `spawn` com `shell: true`.

**Testes:**
- [ ] Docker build funciona
- [ ] Container inicia corretamente

---

### MÉDIO-28: Rate limiting nos endpoints

**Investigar:**
```
apps/api/src/app.module.ts
apps/api/src/app.controller.ts
apps/api/src/auth/auth.controller.ts
```

**Correção:** Adicionar `@Throttle` nos endpoints: health, warmup, change-password, send-delete-confirmation, confirm-deletion.

---

### MÉDIO-29: .dockerignore incompleto

**Investigar:** `.dockerignore`

**Correção:** Completar com: `.github/`, `docs/`, `*.md`, `apps/frontend/`, `apps/dashboard/`, `render.yaml`, `fly.toml`, `.turbo/`, `CHANGELOG.md`, `ROADMAP.md`.

---

## 4. REGRAS DE SEGURANÇA (mantidas)

- Ownership: cada correção preserva a regra "apenas proprietário acessa seu conteúdo"
- Testar acesso cruzado: User A → conteúdo de B = 403
- Não expor PII em logs
- Não quebrar fluxo de auth existente
- Prisma client deve ser regenerado após qualquer alteração de schema

---

## 5. REGRAS DE TESTES

Para cada vulnerabilidade:

1. **ANTES:** Documentar comportamento explorável (se aplicável)
2. **Implementar correção**
3. **DEPOIS:** Validar que o comportamento explorável foi bloqueado
4. Criar teste unitário ou de integração

### Testes obrigatórios:

| Fluxo | Teste |
|-------|-------|
| Register | Funciona com dados válidos, rejeita inválidos |
| Login | Funciona, bloqueia após 5 falhas |
| Refresh | Novo access token, rejeita token revogado |
| Logout | Revoga refresh token |
| Logout-all | Revoga todos os tokens |
| Change password | Funciona, revoga tokens antigos |
| Reset password | Funciona, revoga tokens antigos |
| Verify email | Funciona com token válido |
| Delete account | Anonimiza/remove dados |
| CRUD notebooks | Ownership preservado |
| CRUD leaves | Ownership preservado |

### Comandos de execução:

```bash
# Lint
yarn workspace api lint

# Build
yarn workspace api build

# Testes (se existirem)
yarn workspace api test

# Frontend build
yarn workspace frontend build
```

---

## 6. RELATÓRIO DE SAÍDA

Ao final deste prompt, gerar relatório contendo:

### Arquivos Alterados
Lista de cada arquivo modificado com descrição da mudança.

### Vulnerabilidades Corrigidas
Para cada ALTO e MÉDIO:
- ID
- Status: CORRIGIDO / FALSO_POSITIVO / NÃO_REPRODUZÍVEL / ADIADO
- Evidência
- Teste executado e resultado

### Vulnerabilidades Não Corrigidas
Justificativa para cada uma.

### Interações entre Correções
Como as correções interagem entre si (ex: rate limiting + lockout + DTOs).

### Testes
| Teste | Resultado |
|-------|-----------|
| Lint | PASS/FAIL |
| Typecheck | PASS/FAIL |
| Unit tests | PASS/FAIL |
| Integration tests | PASS/FAIL |
| Build API | PASS/FAIL |
| Build Frontend | PASS/FAIL |

### Riscos Restantes
Lista de riscos que persistem.

### Decisões Técnicas
Decisões tomadas e justificativas.

---

## 7. O QUE NÃO DEVE SER ALTERADO NESTE PROMPT

- Configuração de deploy (fly.toml, render.yaml) — exceto se ALTO-8 exigir
- Estrutura de branches
- Bibliotecas principais (NestJS, Prisma, React) — exceto adições pontuais (DOMPurify)
- Fluxo de refresh token existente (pode adicionar, não modificar sem necessidade)
- Schema Prisma além do necessário (User model para lockout, EditHistory para retenção)
- Achados CRÍTICOS (já feitos no PROMPT 1)
- Achados BAIXOS (reservados para PROMPT 3)
- Endpoints de saúde (health, warmup) — não remover, apenas adicionar rate limit
