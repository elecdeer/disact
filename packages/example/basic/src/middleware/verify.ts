import { verifyKey } from "discord-interactions";
import type { MiddlewareHandler } from "hono";
import { getLogger } from "@logtape/logtape";

const logger = getLogger(["example", "middleware"]);

/**
 * Discord Interaction webhook署名検証ミドルウェア
 *
 * X-Signature-Ed25519とX-Signature-Timestampヘッダーを使用して、
 * リクエストがDiscordから送信されたものであることを検証します。
 *
 * @see https://discord.com/developers/docs/interactions/receiving-and-responding#security-and-authorization
 */
export const verifyDiscordRequest = (): MiddlewareHandler => {
  return async (c, next) => {
    const publicKey = process.env.DISCORD_PUBLIC_KEY;

    if (!publicKey) {
      logger.error("DISCORD_PUBLIC_KEY environment variable not set");
      return c.text("Internal Server Error", 500);
    }

    const signature = c.req.header("X-Signature-Ed25519");
    const timestamp = c.req.header("X-Signature-Timestamp");

    if (!signature || !timestamp) {
      logger.warn("Missing signature headers");
      return c.text("Unauthorized", 401);
    }

    // 生のリクエストボディを取得
    const body = await c.req.text();

    try {
      const isValid = await verifyKey(body, signature, timestamp, publicKey);

      if (!isValid) {
        logger.warn("Signature verification failed", {
          timestampAge: Date.now() - Number(timestamp) * 1000,
        });
        return c.text("Unauthorized", 401);
      }

      logger.debug("Signature verified successfully");
      // 検証成功：bodyを再利用できるようにコンテキストに保存
      c.set("rawBody", body);

      await next();
    } catch (error) {
      logger.error("Error during signature verification", { error });
      return c.text("Unauthorized", 401);
    }
  };
};
