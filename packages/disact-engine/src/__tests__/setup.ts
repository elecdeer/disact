import { configure, getConsoleSink, jsonLinesFormatter } from "@logtape/logtape";

/**
 * テスト環境でのlogger設定
 * 環境変数ENABLE_TEST_LOGでログ出力を制御できる
 */
const enableTestLog = process.env.ENABLE_TEST_LOG === "true";

if (enableTestLog) {
  await configure({
    reset: true,
    sinks: {
      console: getConsoleSink({
        formatter: jsonLinesFormatter,
      }),
    },
    loggers: [
      { category: ["disact-engine", "scheduler"], lowestLevel: "trace", sinks: ["console"] },
    ],
  });
}
