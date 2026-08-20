# PROMPT 3 — CORREÇÕES BAIXO + HARDENING + AUDITORIA FINAL

**Objetivo:** Corrigir as 12 vulnerabilidades BAIXO, realizar hardening de segurança e executar auditoria completa do projeto.

**Pré-requisito:** PROMPT 1 e PROMPT 2 concluídos com sucesso. Verificar que CRÍTICOS e ALTO/MÉDIO foram corrigidos antes de iniciar.

**Branch de trabalho:** `development` (SQLite local), com cherry-pick para `main` e `homologacao` ao final.

---

## 1. CONTEXTO

### 1.1 Estado do Projeto Após PROMPT 1 e 2

- Tokens de reset/verificação hasheados com SHA-256
- Sessões revogadas em password change/reset
- TLS validado na migração Supabase
- PII anonimizada/removida na exclusão de conta
- Código de confirmação usando crypto.randomInt
- Senhas com limite máximo (128 chars)
- Endpoint debug protegido
- Dockerfile/.dockerignore corrigidos
- JWT secrets sem fallbacks hardcoded
- DOMPurify no editor Tiptap
- DTOs criados para endpoints de auth
- Logs de login unificados
- EditHistory com política de retenção
- DATABASE_URL devidamente redatada
- Access token com TTL reduzido
- Lockout de conta implementado
- Logout-all implementado
- CSP configurado no frontend
- Console.log condicionais ao DEV
- Open redirect corrigido
- Rate limiting aplicado

### 1.2 Regras Fundamentais (mantidas)

1. NÃO assumir vulnerabilidade sem confirmação
2. Investigar antes de corrigir
3. Preservar funcionalidades existentes
4. Não inventar arquivos, endpoints ou resultados
5. Ownership preservado

---

## 2. VULNERABILIDADES BAIXO

### BAIXO-30: Comparação não constant-time

**Investigar:**
```
apps/api/src/auth/delete-account.service.ts
```

**Correção:** Usar `crypto.timingSafeEqual` para comparar o código de confirmação.

**Testes:**
- [ ] Código correto → sucesso
- [ ] Código incorreto → erro (mesmo timing)

---

### BAIXO-31: Access token não revogado quando família é terminada

**Investigar:**
```
apps/api/src/auth/auth-core.service.ts
```

**Análise:** Quando token reuse é detectado, todos os refresh tokens da família são revogados. Porém o access token (JWT assinado, TTL 15min após PROMPT 2) continua válido.

**Correção:** Implementar `tokenVersion` no User model. Incrementar quando família é revogada. Validar no JwtStrategy.

**Testes:**
- [ ] Token reuse detectado → refresh token revogado
- [ ] Access token antigo ainda funciona até expirar (aceitável)
- [ ] Novo login gera novo access token

---

### BAIXO-32: Debug log com resultado de senha

**Investigar:**
```
apps/api/src/auth/auth-core.service.ts
```

**Correção:** Remover `isPasswordValid` do log. Logar apenas "Falha de autenticação".

**Testes:**
- [ ] Log de login falho não contém resultado da validação de senha

---

### BAIXO-33: .env.example com placeholders realistas

**Investigar:**
```
apps/api/.env.example
```

**Correção:** Substituir por placeholders óbvios: `CHANGE_ME_BEFORE_DEPLOY`.

**Testes:**
- [ ] `.env.example` contém apenas placeholders seguros

---

### BAIXO-34: Password inputs sem autocomplete

**Investigar:**
```
apps/frontend/src/modules/auth/views/LoginView.tsx
apps/frontend/src/modules/auth/views/RegisterView.tsx
apps/frontend/src/modules/auth/views/ResetPasswordView.tsx
apps/frontend/src/modules/profile/PasswordChangeForm.tsx
```

**Correção:** Adicionar `autocomplete="current-password"` em login e `autocomplete="new-password"` em register/change-password.

**Testes:**
- [ ] Login: `autocomplete="current-password"` presente
- [ ] Register: `autocomplete="new-password"` presente

---

### BAIXO-35: sessionStorage redirect sem validação

**Investigar:**
```
apps/frontend/src/main.tsx
```

**Correção:** Validar que redirect começa com `/` e não com `//`.

**Testes:**
- [ ] Redirect `//evil.com` → ignorado
- [ ] Redirect `/dashboard` → funciona

---

### BAIXO-36: Clipboard history em localStorage

**Investigar:**
```
apps/frontend/src/store/clipboardStore.ts
```

**Análise:** Clipboard store mantém até 50 itens de texto copiado em localStorage. Dados podem conter senhas ou informações sensíveis.

**Correção:** Limpar clipboard no logout. Limitar tamanho dos itens armazenados (max 500 chars por item).

**Testes:**
- [ ] Após logout, clipboard está vazio
- [ ] Item > 500 chars é truncado

---

### BAIXO-37: Bookmark paths sem validação

**Investigar:**
```
apps/frontend/src/modules/bookmarks/views/BookmarksView.tsx
```

**Correção:** Validar que `bookmark.path` começa com `/` e não com `//`.

**Testes:**
- [ ] Path `//evil.com` → ignorado
- [ ] Path `/notebooks/123` → funciona

---

### BAIXO-38: Código de exclusão dev mode na UI

**Investigar:**
```
apps/frontend/src/modules/profile/hooks/useDeleteAccount.ts
apps/frontend/src/modules/profile/DeleteAccountModals.tsx
```

**Correção:** Verificar se backend retorna código apenas em dev. Se sim, adicionar guard no frontend: se `import.meta.env.PROD` e código retornado → erro.

**Testes:**
- [ ] Em produção, código não é exibido

---

### BAIXO-39: LoginDto aceita senha de 1 caractere

**Investigar:**
```
apps/api/src/auth/dto/login.dto.ts
```

**Correção:** Alterar `@MinLength(1)` para `@MinLength(8)` no campo password do LoginDto.

**Testes:**
- [ ] Login com senha < 8 caracteres → 400

---

### BAIXO-40: Docker image roda como root

**Investigar:**
```
apps/api/Dockerfile
```

**Correção:** Adicionar `USER app` após setup do container.

**Testes:**
- [ ] Docker build funciona
- [ ] Container inicia como usuário não-root

---

### BAIXO-41: Sem security scanning no CI

**Investigar:**
```
.github/workflows/
```

**Correção:** Adicionar step de `npm audit` ao CI workflow. Não adicionar ferramentas desnecessárias.

**Testes:**
- [ ] CI pipeline executa audit sem falhas

---

## 3. HARDENING FINAL

Após corrigir os BAIXOS, executar auditoria completa:

### 3.1 Authentication

**Verificar:**
- JWT: assinatura, expiração, invalidação
- Refresh token: rotação, hash, family, revogação
- Password reset: fluxo completo, token hashing
- Email verification: fluxo completo
- Brute force: rate limiting + lockout
- Logout: server-side + client-side
- Logout-all: todos os dispositivos
- Account deletion: PII removido/anonimizado

**Testar:**
```
User A register → login → access token → refresh → new access → logout → refresh antigo → 401
User A → change password → refresh tokens antigos → 401
User A → reset password → refresh tokens antigos → 401
User A → login 5x com senha errada → lockout → login correto → funciona
User A → logout-all → todas as sessões encerradas
User A → delete account → dados anonimizados → login → 401
```

### 3.2 Authorization

**Testar horizontal privilege escalation:**
```
User A → CRUD notebooks de A → permitido
User A → CRUD notebooks de B → 403/404
User A → CRUD leaves de A → permitido
User A → CRUD leaves de B → 403/404
User A → CRUD flashcards de A → permitido
User A → CRUD flashcards de B → 403/404
User A → bookmarks de A → permitido
User A → bookmarks de B → 403/404
User A → study sessions de A → permitido
User A → study sessions de B → 403/404
```

**Testar vertical privilege escalation:**
```
User A → /api/debug/connections → 403 (se protegido)
User A → admin endpoints → 403
```

**Testar conteúdo público:**
```
Notebook público → qualquer user → permitido
Leaf pública → qualquer user → permitido
Conteúdo privado → user não autenticado → 401
```

### 3.3 API

**Verificar:**
- SQL injection: Prisma parameterized queries (já OK)
- NoSQL injection: N/A (Prisma)
- Command injection: N/A (sem eval/child_process)
- SSRF: N/A (sem fetch de URLs externas user-controlled)
- Path traversal: N/A (sem file system operations)
- Mass assignment: ValidationPipe com whitelist (já OK)
- Excessive payload: @MaxLength em DTOs
- Rate limiting: ThrottlerModule configurado
- IDOR: Ownership checks em todos os endpoints
- CORS: allowlist em produção
- Validation: class-validator em DTOs
- Error leakage: 5xx sanitizados em produção

### 3.4 Frontend

**Verificar:**
- XSS: React auto-escaping + DOMPurify no Tiptap
- DOM XSS: nenhum dangerouslySetInnerHTML
- Stored XSS: conteúdo sanitizado antes de render
- Open redirect: paths validados
- Secrets expostos: nenhum hardcoded
- Source maps: verificar se desabilitados em produção
- localStorage: clipboard limpo no logout
- SessionStorage: redirect validado
- Cookies: httpOnly, secure, sameSite configurados
- CSP: configurado
- iframe embedding: frame-ancestors 'none'
- URL handling: scheme validation

### 3.5 Infraestrutura

**Verificar:**
- Dockerfile: non-root user, .dockerignore completo
- Docker image: sem arquivos sensíveis
- Secrets: não hardcoded, não em logs
- Environment variables: validação no startup
- Exposed ports: apenas necessárias
- Dependency vulnerabilities: npm audit

### 3.6 Dados

**Verificar:**
- PII: anonimizado na exclusão
- Logs: sem PII em produção
- Backups: documentar estratégia
- Histórico: política de retenção
- Exclusão: funciona corretamente
- Ownership: testado em todos os endpoints
- Dados órfãos: sem registros sem referência

---

## 4. SECURITY SCANNING

Executar quando disponível:

```bash
# npm audit
yarn audit --audit-level=high

# Lint
yarn workspace api lint
yarn workspace frontend lint

# Build
yarn workspace api build
yarn workspace frontend build

# Typecheck (se disponível)
# Verificar scripts no package.json
```

Não adicionar ferramentas que não estejam já no projeto. Se `npm audit` reportar vulnerabilities, documentar mas NÃO atualizar dependências automaticamente (pode quebrar funcionalidade).

---

## 5. TESTES DE REGRESSÃO COMPLETOS

Executar todos os fluxos principais:

| Fluxo | Comando/Método | Esperado |
|-------|---------------|----------|
| Register | POST /api/auth/register | 201 |
| Login | POST /api/auth/login | 200 + cookies |
| Refresh | POST /api/auth/refresh | 200 + novo access |
| Logout | POST /api/auth/logout | 200 + cookies limpos |
| Logout-all | POST /api/auth/logout-all | 200 |
| Forgot password | POST /api/auth/forgot-password | 200 |
| Reset password | POST /api/auth/reset-password | 200 |
| Verify email | POST /api/auth/verify-email | 200 |
| Change password | POST /api/auth/change-password | 200 |
| Delete account | POST /api/auth/send-delete-confirmation | 200 |
| Confirm deletion | POST /api/auth/confirm-deletion | 200 |
| Create notebook | POST /api/notebooks | 201 |
| Read notebook | GET /api/notebooks/:id | 200 |
| Update notebook | PUT /api/notebooks/:id | 200 |
| Delete notebook | DELETE /api/notebooks/:id | 200 |
| Create leaf | POST /api/notebooks/:id/leaves | 201 |
| Read leaf | GET /api/leaves/:id | 200 |
| Update leaf | PUT /api/leaves/:id | 200 |
| Delete leaf | DELETE /api/leaves/:id | 200 |
| Flashcards | GET/POST /api/flashcards | 200/201 |
| Bookmarks | GET/POST /api/bookmarks | 200/201 |

---

## 6. AUDITORIA FINAL — CHECKLIST COMPLETO

Para cada um dos 41 achados, gerar:

```
ID: [CRIT-1 a BAIXO-41]
Título: [descrição]
Status anterior: [descrição do problema]
Status atual: CORRIGIDO / PARCIALMENTE_CORRIGIDO / FALSO_POSITIVO / NÃO_REPRODUZÍVEL / ADIADO
Correção aplicada: [descrição da mudança]
Arquivo(s): [lista de arquivos modificados]
Teste realizado: [descrição do teste]
Resultado: PASS / FAIL
Evidência: [código antes/depois ou justificativa]
Risco residual: [riscos que persistem]
```

---

## 7. RELATÓRIO CONSOLIDADO FINAL

Ao final deste prompt, gerar relatório completo:

### Resumo
```
Total: 41
Corrigidos: X
Parcialmente corrigidos: X
Falsos positivos: X
Não reproduzíveis: X
Adiados: X
```

### Corrigidos (detalhado)
Para cada item CORRIGIDO: ID, título, arquivo, teste, evidência.

### Falsos Positivos (detalhado)
Para cada FALSO_POSITIVO: ID, título, justificativa, evidência de que não é vulnerabilidade.

### Não Reproduzíveis (detalhado)
Para cada NÃO_REPRODUZÍVEL: ID, título, motivo.

### Adiados (detalhado)
Para cada ADIADO: ID, título, motivo, plano para corrigir depois.

### Riscos Residuais
Lista de todos os riscos que persistem mesmo após todas as correções.

### Arquivos Alterados
Lista completa de todos os arquivos modificados nos 3 prompts.

### Testes
| Teste | Resultado |
|-------|-----------|
| Unit tests | PASS/FAIL |
| Integration tests | PASS/FAIL |
| E2E tests | PASS/FAIL |
| Lint API | PASS/FAIL |
| Lint Frontend | PASS/FAIL |
| Typecheck API | PASS/FAIL |
| Typecheck Frontend | PASS/FAIL |
| Build API | PASS/FAIL |
| Build Frontend | PASS/FAIL |
| Docker build | PASS/FAIL |
| npm audit | PASS/FAIL |

### Fluxos Testados
| Fluxo | Resultado |
|-------|-----------|
| Register | PASS/FAIL |
| Login | PASS/FAIL |
| Refresh | PASS/FAIL |
| Logout | PASS/FAIL |
| Logout-all | PASS/FAIL |
| Forgot password | PASS/FAIL |
| Reset password | PASS/FAIL |
| Verify email | PASS/FAIL |
| Change password | PASS/FAIL |
| Delete account | PASS/FAIL |
| CRUD notebooks | PASS/FAIL |
| CRUD leaves | PASS/FAIL |
| Flashcards | PASS/FAIL |
| Bookmarks | PASS/FAIL |
| Ownership check | PASS/FAIL |

---

## 8. O QUE NÃO DEVE SER ALTERADO NESTE PROMPT

- Configuração de deploy (fly.toml, render.yaml)
- Estrutura de branches
- Bibliotecas principais
- Fluxo de auth existente (pode adicionar, não modificar sem necessidade)
- Schema Prisma além do necessário (User model para lockout/tokenVersion)
- Achados CRÍTICOS e ALTO/MÉDIO (já feitos)
- Endpoints de saúde
- Funcionalidades existentes do app (notebooks, leaves, flashcards, etc.)
