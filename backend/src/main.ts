import "reflect-metadata";
import { BadRequestException, Injectable, PipeTransform, ArgumentMetadata } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadEnvConfig } from "./config/env.config";

@Injectable()
class WriteBodyValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== "body") return value;
    if (value === undefined) return value;
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new BadRequestException("بدنه درخواست باید یک آبجکت معتبر JSON باشد");
    }
    return value;
  }
}

async function bootstrap() {
  const config = loadEnvConfig();
  const app = await NestFactory.create(AppModule);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable("x-powered-by");
  expressApp.use((_req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  });

  const configuredOrigins = config.frontendOrigin
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([
    ...configuredOrigins,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://amirghadimii.github.io",
  ]);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow same-origin / server-to-server / curl without Origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  });

  app.useGlobalPipes(new WriteBodyValidationPipe());

  await app.listen(config.port);
}

bootstrap();
