import { verifyKey } from "discord-interactions";
import type { MiddlewareHandler } from "hono";

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
      console.error("DISCORD_PUBLIC_KEY環境変数が設定されていません");
      return c.text("Internal Server Error", 500);
    }

    const signature = c.req.header("X-Signature-Ed25519");
    const timestamp = c.req.header("X-Signature-Timestamp");

    if (!signature || !timestamp) {
      console.warn("署名ヘッダーが見つかりません");
      return c.text("Unauthorized", 401);
    }

    // 生のリクエストボディを取得
    const body = await c.req.text();

    try {
      const isValid = await verifyKey(body, signature, timestamp, publicKey);

      if (!isValid) {
        console.warn("署名検証に失敗しました");
        return c.text("Unauthorized", 401);
      }

      // 検証成功：bodyを再利用できるようにコンテキストに保存
      c.set("rawBody", body);

      await next();
    } catch (error) {
      console.error("署名検証中にエラーが発生しました:", error);
      return c.text("Unauthorized", 401);
    }
  };
};
