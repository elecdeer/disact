import { configure, getConsoleSink } from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";

/**
 * logtapeのログ設定を初期化
 * アプリケーション起動時に1回だけ呼び出す
 */
export const configureLogging = async (): Promise<void> => {
  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: getPrettyFormatter({
          timestamp: "time",
          properties: true,
          inspectOptions: {
            depth: 10, // 深くネストされたオブジェクトも表示（デフォルトは2）
            colors: true, // 色付きで表示
          },
        }),
      }),
    },
    filters: {},
    loggers: [
      // disactライブラリのログ
      {
        category: ["disact"],
        lowestLevel: "debug", // 開発環境ではdebug以上を出力
        sinks: ["console"],
      },
      // disact-engineのログ
      {
        category: ["disact-engine"],
        lowestLevel: "debug",
        sinks: ["console"],
      },
      // exampleアプリケーションのログ
      {
        category: ["example"],
        lowestLevel: "info",
        sinks: ["console"],
      },
    ],
  });
};
