import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Global API prefix ──
  app.setGlobalPrefix("api");

  // ── Security Headers (Helmet) ──
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "production" ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ── CORS ──
  const nodeEnv = process.env.NODE_ENV || "development";
  console.log(nodeEnv);
  console.log(process.env.FRONTEND_URL);
  if (nodeEnv === "production" && !process.env.FRONTEND_URL) {
    throw new Error(
      "❌ FRONTEND_URL é obrigatória em produção. " +
        "Defina a variável de ambiente FRONTEND_URL com a(s) URL(s) do frontend " +
        "(ex: https://meuapp.com ou https://app1.com,https://app2.com).",
    );
  }

  // Origens permitidas: FRONTEND_URL pode ser uma lista separada por vírgulas
  const rawOrigins = process.env.FRONTEND_URL || "http://localhost:5173";
  const allowedOrigins = rawOrigins
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Permitir requisições sem origin (como chamadas server-to-server ou Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Origem bloqueada: ${origin}`);
        callback(new Error(`Origem ${origin} não permitida pelo CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // ── Cookie Parser ──
  app.use(cookieParser());

  // ── Request Logger (apenas em dev, sem dados sensíveis) ──
  if (nodeEnv !== "production") {
    app.use((req: any, res: any, next: () => void) => {
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`,
        );
      });
      next();
    });
  }

  const PORT = process.env.PORT || 3000;
  const HOST = "0.0.0.0";

  await app.listen(PORT, HOST, () => {
    const divider = "=".repeat(45);
    console.log(divider);
    console.log(`  Servidor NestJS rodando em: http://${HOST}:${PORT}`);
    console.log(`  Base da API: http://${HOST}:${PORT}/api`);
    console.log(`  Frontends permitidos: ${allowedOrigins.join(", ")}`);
    console.log(`  Ambiente: ${nodeEnv}`);
    console.log(divider);
  });
}

bootstrap();
