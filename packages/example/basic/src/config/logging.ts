import { ansiColorFormatter, configure, getConsoleSink } from "@logtape/logtape";

/**
 * logtapeのログ設定を初期化
 * アプリケーション起動時に1回だけ呼び出す
 */
export const configureLogging = async (): Promise<void> => {
  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: ansiColorFormatter,
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
