# Correção Essencial — Avaliação de Segurança

**Data:** 20/08/2026 | **Escopo:** API (NestJS), Frontend (React), Infraestrutura, Dados/Privacidade

---

## Resumo

| Severidade | Quantidade |
|------------|-----------|
| **CRÍTICO** | 5 |
| **ALTO** | 10 |
| **MÉDIO** | 14 |
| **BAIXO** | 12 |
| **Total** | **41** |

---

## CRÍTICO (5)

### 1. Tokens de reset de senha armazenados em plaintext no banco
- **Arquivo:** `apps/api/src/auth/password.service.ts:101,157`
- Tokens de reset (`resetPasswordToken`) e verificação de email (`verificationToken`) são UUIDs brutos no banco. Um atacante com acesso ao DB pode usar diretamente. Os refresh tokens são corretamente hasheados com SHA-256, mas esses não.
- **Fix:** Hashear com SHA-256 antes de armazenar, como já feito para refresh tokens.

### 2. Reset de senha não invalida sessões existentes
- **Arquivo:** `apps/api/src/auth/password.service.ts:52-58,190-196`
- Ao mudar/resetar senha, os refresh tokens ativos **não** são revogados. Um atacante com token roubado continua autenticado.
- **Fix:** Adicionar `refreshToken.updateMany({ where: { userId }, data: { revokedAt: new Date() } })` após atualizar a senha.

### 3. TLS desabilitado na migração Supabase
- **Arquivo:** `apps/api/scripts/migrate-supabase.js:173-175`
- `rejectUnauthorized: false` permite MITM no tráfego do banco.
- **Fix:** Usar o certificado CA do Supabase ou `sslmode=verify-full` na connection string.

### 4. Exclusão de conta é apenas soft-delete — dados PII nunca são apagados
- **Arquivo:** `apps/api/src/auth/delete-account.service.ts:105-108,121`
- `deletedAt` é setado mas todos os dados (notebooks, leaves, flashcards, etc.) permanecem para sempre. A mensagem diz "Conta excluída permanentemente" — falsa.
- **Fix:** Cascade-delete de todos os dados do usuário, ou job agendado para purge após 30 dias.

### 5. `Math.random()` para código de confirmação de exclusão
- **Arquivo:** `apps/api/src/auth/delete-account.service.ts:33`
- Não é criptograficamente seguro. Com 6 dígitos (1M possibilidades) e TTL de 15min, é brute-forceável.
- **Fix:** `crypto.randomInt(100000, 999999)` + rate limit no endpoint.

---

## ALTO (10)

### 6. Sem limite de tamanho máximo para senha — DoS via bcrypt
- **Arquivo:** `apps/api/src/auth/dto/register.dto.ts:12`, `apps/api/src/auth/auth.utils.ts:9`
- bcrypt é CPU-intensivo. Payloads de 1MB no campo senha esgotam o servidor.
- **Fix:** `@MaxLength(128)` no DTO.

### 7. Endpoint `/api/debug/connections` expõe infraestrutura a qualquer usuário autenticado
- **Arquivo:** `apps/api/src/app.controller.ts:79-126`
- Retorna driver do DB, memória, config SMTP, latência. Acessível por qualquer user com JWT.
- **Fix:** Restringir a admin ou remover em produção.

### 8. Dockerfile copia monorepo inteiro
- **Arquivo:** `apps/api/Dockerfile:37`, `.dockerignore`
- `COPY . .` inclui `.github/`, `render.yaml`, scripts de setup. Camadas intermediárias podem conter segredos.
- **Fix:** Expandir `.dockerignore` significativamente e copiar apenas `apps/api/`.

### 9. Secrets JWT hardcoded em 4+ arquivos como fallback
- **Arquivos:** `main.ts:25,40`, `auth.module.ts:22`, `jwt.strategy.ts:23`, `auth-core.service.ts:44`
- Se `NODE_ENV` for mal configurado, tokens são assinados com segredos públicos.
- **Fix:** Remover fallbacks; lançar erro sempre que secrets não estiverem definidos.

### 10. `.gitignore` incompleto para `.env.*`
- **Arquivo:** `.gitignore:28-29`
- `.env.production`, `.env.staging` etc. não são ignorados.
- **Fix:** Adicionar `.env.*` ao `.gitignore`.

### 11. HTML não sanitizado carregado no editor Tiptap
- **Arquivo:** `apps/frontend/src/modules/leaves/hooks/useEditorContent.ts:133,100`
- Conteúdo do servidor é carregado sem sanitização. Links `javascript:` podem ser ativados via Ctrl+Click.
- **Fix:** Adicionar DOMPurify + validação de scheme de URL.

### 12. DTOs ausentes em endpoints de auth
- **Arquivo:** `apps/api/src/auth/auth.controller.ts:133,141,148,155,169,178,197`
- `forgotPassword`, `resetPassword`, `verifyEmail`, etc. usam `@Body() body: {...}` sem validação com class-validator.
- **Fix:** Criar DTOs com decorators (`@IsEmail`, `@MinLength`, `@IsUUID`).

### 13. Enumeração de usuários via logs de login
- **Arquivo:** `apps/api/src/auth/auth-core.service.ts:310-315`
- Log diferencia "usuário não encontrado" de "senha inválida".
- **Fix:** Mensagem genérica para ambos os casos.

### 14. EditHistory armazena diffs completos em plaintext
- **Arquivo:** `apps/api/prisma/schema.prisma:110-124`
- Histórico completo de edições acumula indefinidamente sem retenção.
- **Fix:** Política de retenção (ex: 6 meses) + criptografia ou limitar campos armazenados.

### 15. DATABASE_URL loggada com redação incompleta
- **Arquivo:** `apps/api/src/main.ts:233-234`
- Apenas `authToken` é mascarado. Senhas em URL (`user:password@host`) ficam expostas.
- **Fix:** Redator tudo: `://[^@]+@` → `://***:***@`.

---

## MÉDIO (14)

| # | Achado | Arquivo |
|---|--------|---------|
| 16 | TTL do access token é 24h (recomendado 15-30min) | `auth.module.ts:23` |
| 17 | Sem lockout de conta após tentativas falhas | `auth-core.service.ts:293-318` |
| 18 | SameSite=None no cookie de refresh em produção (CSRF) | `auth.controller.ts:32` |
| 19 | Sem endpoint "logout de todos os dispositivos" | `auth.controller.ts` |
| 20 | Campo `name` sem `@MaxLength` | `dto/register.dto.ts:5` |
| 21 | CSP `style-src 'unsafe-inline'` | `main.ts:93` |
| 22 | Frontend sem CSP (nem meta tag nem headers) | `index.html`, `vite.config.ts` |
| 23 | Console.log de estado auth em produção | `store.ts:135-188` |
| 24 | Sem token CSRF em requisições state-changing | `client.ts` |
| 25 | Open redirect via React Router state | `PublicRoute.tsx:24-26` |
| 26 | Schema divergence SQLite/PostgreSQL entre branches | `schema.prisma` |
| 27 | Docker entrypoint usa `shell: true` | `docker-entrypoint.js:14` |
| 28 | Sem rate limiting nos endpoints health/warmup | `app.controller.ts` |
| 29 | `.dockerignore` muito incompleto | `.dockerignore` |

---

## BAIXO (12)

| # | Achado | Arquivo |
|---|--------|---------|
| 30 | Comparação de código de exclusão não é constant-time | `delete-account.service.ts:89` |
| 31 | Access token não revogado quando família é terminada | `auth-core.service.ts:381-394` |
| 32 | Debug log indica se senha estava correta | `auth-core.service.ts:304-306` |
| 33 | `.env.example` com placeholders realistas | `.env.example:21-22` |
| 34 | Password inputs sem `autocomplete` | Múltiplos auth views |
| 35 | sessionStorage redirect sem validação de path | `main.tsx:29-36` |
| 36 | Clipboard history (50 itens) em localStorage | `clipboardStore.ts:91-95` |
| 37 | Bookmark paths do servidor usados direto no `navigate()` | `BookmarksView.tsx:59` |
| 38 | Código de exclusão dev mode exposto na UI | `useDeleteAccount.ts:76-81` |
| 39 | LoginDto aceita senha de 1 caractere | `dto/login.dto.ts:7-9` |
| 40 | Docker image roda como root | `Dockerfile` |
| 41 | Sem security scanning no CI (npm audit, trivy, etc.) | `.github/workflows/` |

---

## Pontos Fortes (já implementados)

- **Refresh token rotation** com SHA-256 hash, family tracking e revogação em reuse
- **bcrypt 14 salt rounds** para senhas
- **Access token apenas em memória** (não em localStorage)
- **HttpOnly + Secure cookies** para refresh tokens
- **Helmet com CSP, HSTS, frame-ancestors**
- **CORS com allowlist** em produção + bloqueio de requests sem Origin
- **ValidationPipe global** com `whitelist` e `forbidNonWhitelisted`
- **Escape HTML** em templates de email
- **Sanitização de erros 5xx** em produção
- **Produção sem secrets** = app recusa iniciar
- **Prisma** — zero SQL injection (todas as queries parameterizadas)
- **Ownership checks** consistentes em todos os endpoints
- **Soft-delete** com cascata correta em notebooks

---

## Ordem de Priorização Recomendada

1. **Imediato:** CRIT-1, CRIT-2 (tokens plaintext + sessões não revogadas)
2. **Antes de produção:** CRIT-3, CRIT-4, CRIT-5, ALTO-8, ALTO-9
3. **Curto prazo:** ALTO-6, ALTO-7, ALTO-10 a ALTO-15
4. **Iterações:** Todos os MÉDIOs
5. **Backlog:** BAIXOs
