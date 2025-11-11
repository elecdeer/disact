import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { handleInteraction } from "./handlers/interactions.js";
import { verifyDiscordRequest } from "./middleware/verify.js";

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

console.log(`Server starting on port ${port}...`);
console.log("Environment:");
console.log(
  `  DISCORD_PUBLIC_KEY: ${process.env.DISCORD_PUBLIC_KEY ? "Set" : "Not set"}`,
);
console.log(`  PORT: ${port}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server is running on http://localhost:${port}`);
console.log(`Webhook URL: http://localhost:${port}/interactions`);
