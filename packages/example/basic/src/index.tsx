import { serve } from "@hono/node-server";
import { getLogger } from "@logtape/logtape";
import { trace } from "@opentelemetry/api";
import { Hono } from "hono";
import { configureLogging } from "./config/logging.js";
import { configureTelemetry } from "./config/telemetry.js";
import { handleInteraction } from "./handlers/interactions.js";
import { verifyDiscordRequest } from "./middleware/verify.js";

// OpenTelemetryを先に初期化（LogTapeのOTel sinkが使用するため）
configureTelemetry();

const logger = getLogger(["example", "server"]);

// logtape設定を初期化（アプリケーション起動時）
await configureLogging();

const tracer = trace.getTracer("example");

const app = new Hono();

// ヘルスチェックエンドポイント
app.get("/", (c) => {
  return c.text("Discord Interaction Server is running!");
});

// Discord Interactionエンドポイント
app.post("/interactions", verifyDiscordRequest(), async (c) => {
  return tracer.startActiveSpan("http.interaction", async (span) => {
    try {
      const response = await handleInteraction(c);
      return c.json(response);
    } finally {
      span.end();
    }
  });
});

const port = Number(process.env.PORT) || 3000;

logger.info("Starting Discord bot server", {
  port,
  hasPublicKey: !!process.env.DISCORD_PUBLIC_KEY,
});

serve({
  fetch: app.fetch,
  port,
});

logger.info("Server started successfully", {
  port,
  webhookUrl: `http://localhost:${port}/interactions`,
});
