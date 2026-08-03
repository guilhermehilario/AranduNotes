import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  // ════════════════════════════════════════════════════════════════
  //  VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE (antes de criar a app)
  //  Em produção, variáveis críticas (JWT_SECRET, REFRESH_SECRET,
  //  FRONTEND_URL) geram warnings com fallbacks seguros para que
  //  o servidor consiga iniciar mesmo em deploys iniciais.
  // ════════════════════════════════════════════════════════════════
  const nodeEnv = process.env.NODE_ENV || "development";
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!process.env.JWT_SECRET) {
    if (nodeEnv === "production") {
      errors.push(
        "JWT_SECRET é obrigatório em produção. Defina como secret no Fly.io: " +
          "fly secrets set JWT_SECRET=<valor>",
      );
    } else {
      process.env.JWT_SECRET = "dev-jwt-secret";
      warnings.push(
        "JWT_SECRET não definido. Usando fallback 'dev-jwt-secret' " +
          "(apenas para desenvolvimento local).",
      );
    }
  }

  if (!process.env.REFRESH_SECRET) {
    if (nodeEnv === "production") {
      errors.push(
        "REFRESH_SECRET é obrigatório em produção. Defina como secret no Fly.io: " +
          "fly secrets set REFRESH_SECRET=<valor>",
      );
    } else {
      process.env.REFRESH_SECRET = "dev-refresh-secret";
      warnings.push(
        "REFRESH_SECRET não definido. Usando fallback 'dev-refresh-secret' " +
          "(apenas para desenvolvimento local).",
      );
    }
  }

  if (nodeEnv === "production" && !process.env.FRONTEND_URL) {
    errors.push(
      "FRONTEND_URL é obrigatória em produção. Defina como secret no Fly.io: " +
        "fly secrets set FRONTEND_URL=https://seuapp.fly.dev",
    );
  }

  if (warnings.length > 0) {
    console.warn("\n⚠️  AVISOS DE CONFIGURAÇÃO:");
    warnings.forEach((w) => console.warn(`  • ${w}`));
    console.warn("");
  }

  if (errors.length > 0) {
    console.error("\n❌ ERROS DE CONFIGURAÇÃO — servidor não pode iniciar:");
    errors.forEach((e) => console.error(`  • ${e}`));
    console.error("");
    throw new Error(
      `Configuração inválida: ${errors.length} erro(s) encontrado(s). ` +
        "Corrija as variáveis de ambiente acima e reinicie o servidor.",
    );
  }

  const app = await NestFactory.create(AppModule);

  // ── Global API prefix ──
  // Rotas de diagnóstico (health, warmup) ficam sem o prefixo /api
  // para serem acessadas diretamente por load balancers (Fly.io, Render) e
  // serviços de monitoramento.
  app.setGlobalPrefix("api", {
    exclude: ["health", "warmup"],
  });

  app.enableShutdownHooks();

  // ── Security Headers (Helmet) ──
  // 🔐 SEC-022: HSTS configurado EXPLICITAMENTE (antes usava o default implícito).
  // Em produção, força HTTPS por 180 dias incluindo subdomínios; em desenvolvimento
  // é desabilitado para não travar o navegador em http://localhost.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https://api.dicebear.com"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      strictTransportSecurity:
        nodeEnv === "production"
          ? { maxAge: 15552000, includeSubDomains: true, preload: true }
          : false,
    }),
  );

  // ── CORS ──

  // Origens permitidas: FRONTEND_URL pode ser uma lista separada por vírgulas
  const rawOrigins = process.env.FRONTEND_URL || "";
  const allowedOrigins = rawOrigins
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Em produção, FRONTEND_URL é obrigatória (validação acima garante que está definida).
  // Fallback permissivo apenas em desenvolvimento para facilitar testes locais.
  const isCorsPermissive = allowedOrigins.length === 0 && nodeEnv !== "production";

  // 🔐 Endpoints de infra/monitoramento chamados por load balancers SEM header
  // Origin (Fly.io → /health, Render → /api/health, UptimeRobot → /warmup).
  const NO_ORIGIN_EXEMPT_PATHS = new Set([
    "/",
    "/health",
    "/warmup",
    "/api/health",
    "/api/warmup",
  ]);
  const READ_METHODS = new Set(["GET", "HEAD"]);

  // 🔐 Bloqueia requisições sem header Origin (curl, Postman, server-to-server).
  // Browsers SEMPRE enviam Origin em requisições cross-site — como frontend e API
  // vivem em domínios diferentes (dev e produção), isso não afeta o app.
  // Registrado ANTES do enableCors para que o CORS nem chegue a processar o pedido.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.origin) {
      // Normaliza barra final (/health/ == /health) para não quebrar monitores
      const normalizedPath = req.path.replace(/\/+$/, "");
      const isExempt =
        READ_METHODS.has(req.method) && NO_ORIGIN_EXEMPT_PATHS.has(normalizedPath);
      if (!isExempt) {
        console.warn(
          `[SEC] Requisição sem Origin bloqueada: ${req.method} ${JSON.stringify(req.path)}`,
        );
        res.status(403).json({ error: "Requisição sem Origin não permitida" });
        return;
      }
    }
    next();
  });

  app.enableCors({
    origin: isCorsPermissive
      ? true // permite qualquer origem (apenas desenvolvimento)
      : (
          origin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void,
        ) => {
          // Requisições sem Origin chegam aqui apenas nos endpoints de infra
          // (health/warmup) — o middleware acima bloqueia as demais.
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            const safeOrigin = JSON.stringify(origin);
            console.warn(`[CORS] Origem bloqueada: ${safeOrigin}`);
            callback(new Error(`Origem ${origin} não permitida pelo CORS`));
          }
        },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // ── Cookie Parser ──
  app.use(cookieParser());

  // ── Middleware de cold start / warm up ──
  // Loga quanto tempo levou para o servidor ficar pronto
  const startupStart = Date.now();

  // ── Middleware global: adiciona header de tempo de startup e saúde do DB ──
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Adiciona header indicando que o servidor está pronto
    res.setHeader("X-Instance-Status", "ready");
    next();
  });

  // ── Request Logger ──
  // Em produção, loga apenas warnings/errors e tempo de resposta lento
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      const shouldLog =
        nodeEnv !== "production" || // Sempre loga em dev
        res.statusCode >= 400 || // Loga erros
        duration > 3000; // Loga requisições lentas (+3s)

      if (shouldLog) {
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`,
        );
      }
    });
    next();
  });

  const PORT = process.env.PORT || 3000;
  const HOST = "0.0.0.0";

  await app.listen(PORT, HOST, () => {
    const startupTime = Date.now() - startupStart;
    const divider = "=".repeat(45);
    console.log(divider);
    console.log(`  Servidor NestJS rodando em: http://${HOST}:${PORT}`);
    console.log(`  Base da API: http://${HOST}:${PORT}/api`);
    console.log(`  Frontends permitidos: ${allowedOrigins.join(", ")}`);
    console.log(`  Ambiente: ${nodeEnv}`);
    console.log(`  Tempo de inicialização: ${startupTime}ms`);
    console.log(divider);
  });
}
const safeDbUrl = process.env.DATABASE_URL?.replace(
    /\?authToken=([^&]+)/i,
    "?authToken=***",
  );
console.log("debug", safeDbUrl);

bootstrap().catch((err) => {
  console.error("❌ Falha ao iniciar o servidor:", err);
  console.error("📋 Diagnóstico:");
  console.error(`  NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  console.error(
    `  DATABASE_URL: ${(process.env.DATABASE_URL || "não definida").replace(/\?authToken=([^&]+)/i, "?authToken=***")}`,
  );
  console.error(`  PORT: ${process.env.PORT || "3000"}`);
  console.error(
    `  Memory RSS: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
  );
  console.error(
    `  Heap Used: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  );
  process.exit(1);
});
