import { getLogger } from "@logtape/logtape";

/**
 * disactパッケージ用のロガーを取得
 * カテゴリは階層的に指定する
 *
 * @example
 * ```typescript
 * const logger = getDisactLogger("api");
 * logger.info("Request sent", { method: "POST", url });
 * ```
 */
export const getDisactLogger = (...category: string[]) => {
  return getLogger(["disact", ...category]);
};
