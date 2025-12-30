import { serve } from "@hono/node-server";
import { getLogger } from "@logtape/logtape";
import { Hono } from "hono";
import { configureLogging } from "./config/logging.js";
import { handleInteraction } from "./handlers/interactions.js";
import { verifyDiscordRequest } from "./middleware/verify.js";

const logger = getLogger(["example", "server"]);

// logtape設定を初期化（アプリケーション起動時）
await configureLogging();

const app = new Hono();

// ヘルスチェックエンドポイント
app.get("/", (c) => {
  return c.text("Discord Interaction Server is running!");
});

// Discord Interactionエンドポイント
app.post("/interactions", verifyDiscordRequest(), async (c) => {
  const response = await handleInteraction(c);
  return c.json(response);
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
